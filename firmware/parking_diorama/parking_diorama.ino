/*
 * Parking Monitoring Diorama - ESP32-WROOM  (FINAL)
 *
 * Entry gate (RIGHT) and Exit gate (LEFT) are two independent state machines.
 * Each gate has: RC522, I2C LCD, buzzer, green LED, red LED, servo, IR sensor.
 * Two HC-SR04 sensors monitor parking space Level 1 and Level 2.
 *
 * WHO DECIDES WHAT
 *  - Entry/exit decisions ..... the gates (this ESP32), works even if the
 * website is down
 *  - Free-space count ......... gate counter: cars through entry - cars through
 * exit - reservations
 *  - "Vehicle really passed" .. the IR sensor (a card tap alone never counts)
 *  - Slot occupied/empty ...... ultrasonic sensors (informational, never change
 * the free count)
 *  - Website .................. mirrors what this ESP32 reports, and sends
 * RESERVATION commands
 *
 * Libraries (Library Manager): MFRC522 (GithubCommunity), LiquidCrystal I2C
 * (Frank de Brabander), ESP32Servo (Kevin Harrington) Board: "ESP32 Dev Module"
 *
 * SERIAL COMMANDS (115200 baud, press Enter; the website will send these same
 * commands later): RES <UID> [seconds]   hold a space for a card (default 900
 * s) CANCEL <UID>          cancel that card's reservation SETIN <UID> admin:
 * force a card to INSIDE SETOUT <UID>          admin: force a card to OUTSIDE
 *   RESET                 admin: every card OUTSIDE, all reservations cleared
 *   STATUS                print the status line now
 */

#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include <MFRC522.h>
#include <Preferences.h>
#include <SPI.h>
#include <Wire.h>
#include "config.h"
#include "network_task.h"

// ===================== PIN MAP =====================
// Shared SPI: SCK 18, MISO 19, MOSI 23      Shared I2C: SDA 21, SCL 22
// ---- ENTRY GATE (RIGHT) ----
#define ENTRY_SS 5
#define ENTRY_RST 16 // RST of BOTH RC522 modules is wired to this one pin
#define ENTRY_SERVO 13
#define ENTRY_GREEN 25
#define ENTRY_RED 26
#define ENTRY_BUZZER 27
#define ENTRY_IR 34
#define ENTRY_LCD_ADDR 0x27
// ---- EXIT GATE (LEFT) ----
#define EXIT_SS 4
#define EXIT_SERVO 14
#define EXIT_GREEN 32
#define EXIT_RED 33
#define EXIT_BUZZER 17
#define EXIT_IR 35
#define EXIT_LCD_ADDR 0x26 // A0 bridged
// ---- PARKING SPACES ----
#define L1_TRIG 2
#define L1_ECHO 36 // SVP, through voltage divider
#define L2_TRIG 15
#define L2_ECHO 39 // SVN, through voltage divider

// ===================== SETTINGS =====================
#define SERVO_CLOSED_ANGLE 0
#define SERVO_OPEN_ANGLE 90
#define IR_ACTIVE_LOW                                                          \
  true                  // most IR modules output LOW when something is detected
#define OCCUPIED_CM_L1 4.0 // Level 1 threshold (reduced to avoid nearby column)
#define OCCUPIED_CM_L2 6.0 // Level 2 threshold (closer than this = slot occupied)

#define TOTAL_CAPACITY                                                         \
  2 // all spaces the gate accounts for (incl. website's virtual slots)

#define GATE_TIMEOUT_MS                                                        \
  15000 // gate closes if no vehicle passes after a valid tap
#define CLEAR_DELAY_MS 1000 // IR must be clear this long before the gate closes
#define MESSAGE_MS 2000
#define DOUBLE_TAP_MS                                                          \
  4000 // same card tapped again within this time = ignored silently

#define IR_STUCK_IDLE_MS                                                       \
  20000 // IR blocked this long while gate is closed = IR fault
#define PASSING_MAX_MS                                                         \
  30000 // vehicle blocking the IR this long while gate is open = alarm
#define SENSOR_FAULT_MS                                                        \
  10000 // ultrasonic gives no valid reading this long = sensor fault
#define DEFAULT_RESERVE_SEC                                                    \
  900 // reservation hold time if the command gives none

// Buzzer type per gate: true = PASSIVE (needs a tone), false = ACTIVE
#define ENTRY_BUZZER_PASSIVE true
#define EXIT_BUZZER_PASSIVE false
#define BUZZ_FREQ 2500

// Invert IR sensor logic per gate if needed (default true for standard active-low FC-51/TCRT5000 modules)
#define ENTRY_IR_ACTIVE_LOW true
#define EXIT_IR_ACTIVE_LOW  true

// ===================== REGISTERED CARDS =====================
#define MAX_CARDS 20

struct Card {
  char uid[16];
  char owner[24];
  char type[10]; // "staff" or "guest"
  bool inside; // vehicle passed the entry gate and has not passed the exit gate
  bool reserved;               // a space is being held for this card
  unsigned long reservedUntil; // millis() deadline
};

Card cards[MAX_CARDS] = {
    {"0054709E", "Admin Staff", "staff", false, false, 0},
    {"8B86FA53", "Student Car", "student", false, false, 0},
    {"6A75A2A5", "Guest Pool 1", "guest", false, false, 0},
};
int cardCount = 3;

// ===================== GATE STRUCT =====================
enum GateState { G_IDLE, G_WAIT_VEHICLE, G_VEHICLE_PASSING, G_MESSAGE };

struct Gate {
  const char *name;
  bool isEntry;
  MFRC522 rfid;
  LiquidCrystal_I2C lcd;
  Servo servo;
  uint8_t pinServo, pinGreen, pinRed, pinBuzzer, pinIR;
  bool passiveBuzzer;
  uint8_t buzzChannel;

  GateState state = G_IDLE;
  unsigned long stateStart = 0;
  unsigned long lastScan = 0;
  unsigned long irClearSince = 0;
  unsigned long irBlockedSince = 0;
  unsigned long buzzerOffAt = 0;
  unsigned long lastAlarm = 0;
  int pendingCard = -1;
  int timeoutStreak = 0;
  bool fault = false; // IR stuck blocked while idle
  bool alarm = false; // vehicle blocking the open gate too long
  String lastUid = "";
  char lastLine1[17] = "";
  char lastLine2[17] = "";

  Gate(const char *n, bool entry, uint8_t ss, uint8_t rst, uint8_t lcdAddr,
       uint8_t sv, uint8_t g, uint8_t r, uint8_t b, uint8_t ir, bool passive,
       uint8_t chan)
      : name(n), isEntry(entry), rfid(ss, rst), lcd(lcdAddr, 16, 2),
        pinServo(sv), pinGreen(g), pinRed(r), pinBuzzer(b), pinIR(ir),
        passiveBuzzer(passive), buzzChannel(chan) {}
};

Gate entryGate("ENTRY", true, ENTRY_SS, ENTRY_RST, ENTRY_LCD_ADDR, ENTRY_SERVO,
               ENTRY_GREEN, ENTRY_RED, ENTRY_BUZZER, ENTRY_IR,
               ENTRY_BUZZER_PASSIVE, 14);
Gate exitGate("EXIT", false, EXIT_SS, MFRC522::UNUSED_PIN, EXIT_LCD_ADDR,
              EXIT_SERVO, EXIT_GREEN, EXIT_RED, EXIT_BUZZER, EXIT_IR,
              EXIT_BUZZER_PASSIVE, 15);

// ===================== PARKING SPACE STATE =====================
bool slotOccupied[2] = {false, false};
bool slotFault[2] = {false, false};
int slotCounter[2] = {0, 0};
float slotDist[2] = {999, 999};
unsigned long slotLastValid[2] = {0, 0};
unsigned long lastUltra = 0;
uint8_t ultraTurn = 0;

// ===================== CAPACITY LOGIC =====================
int insideCount() {
  int n = 0;
  for (int i = 0; i < cardCount; i++)
    if (cards[i].inside)
      n++;
  return n;
}
int parkedCount() {
  int n = 0;
  for (int i = 0; i < 2; i++)
    if (slotOccupied[i])
      n++;
  return n;
}
int inTransitCount() {
  int n = insideCount() - parkedCount();
  return n > 0 ? n : 0;
}
int reservedCount() {
  int n = 0;
  for (int i = 0; i < cardCount; i++)
    if (cards[i].reserved)
      n++;
  return n;
}
int physicalFree() { // spaces not physically taken (reservations ignored)
  int f = TOTAL_CAPACITY - max(insideCount(), parkedCount());
  return f < 0 ? 0 : f;
}
int freeSlots() { // what walk-ins and the website see as "available"
  int f = physicalFree() - reservedCount();
  return f < 0 ? 0 : f;
}

// ===================== MEMORY (survives restarts) =====================
Preferences prefs;
void saveCards() {
  prefs.begin("parking", false);
  prefs.putInt("count", cardCount);
  for (int i = 0; i < cardCount; i++) {
    char ku[12], ko[12], kt[12], ki[12];
    snprintf(ku, sizeof(ku), "u%d", i);
    snprintf(ko, sizeof(ko), "o%d", i);
    snprintf(kt, sizeof(kt), "t%d", i);
    snprintf(ki, sizeof(ki), "i%d", i);
    prefs.putString(ku, cards[i].uid);
    prefs.putString(ko, cards[i].owner);
    prefs.putString(kt, cards[i].type);
    prefs.putBool(ki, cards[i].inside);
  }
  prefs.end();
}
void loadCards() {
  // The compiled cards[] array is always the authoritative card list.
  // Flash (Preferences) only persists the 'inside' state so that a reboot
  // remembers which cars were inside. We never reduce cardCount below the
  // compiled value -- that was the bug that caused card[2] (student) to vanish.
  prefs.begin("parking", false);
  int cnt = prefs.getInt("count", 0);

  // For every compiled card, try to restore its 'inside' state from Flash
  // by matching on UID (robust to reordering or additions in firmware).
  for (int i = 0; i < cardCount; i++) {
    cards[i].inside = false; // safe default
    // Search the saved list for a matching UID
    for (int j = 0; j < cnt && j < MAX_CARDS; j++) {
      char ku[12], ki[12];
      snprintf(ku, sizeof(ku), "u%d", j);
      snprintf(ki, sizeof(ki), "i%d", j);
      String savedUid = prefs.getString(ku, "");
      if (savedUid == cards[i].uid) {
        cards[i].inside = prefs.getBool(ki, false);
        break;
      }
    }
    cards[i].reserved = false;
    cards[i].reservedUntil = 0;
  }

  prefs.end();
  Serial.printf("[BOOT] Loaded %d compiled cards; restored 'inside' state from flash.\n", cardCount);
}

// ===================== HELPERS =====================
void lcdShow(Gate &g, const char *l1, const char *l2) {
  char a[17], b[17];
  snprintf(a, sizeof(a), "%-16.16s", l1);
  snprintf(b, sizeof(b), "%-16.16s", l2);
  if (strcmp(a, g.lastLine1) != 0) {
    g.lcd.setCursor(0, 0);
    g.lcd.print(a);
    strcpy(g.lastLine1, a);
  }
  if (strcmp(b, g.lastLine2) != 0) {
    g.lcd.setCursor(0, 1);
    g.lcd.print(b);
    strcpy(g.lastLine2, b);
  }
}

void buzzerOn(Gate &g) {
  if (g.passiveBuzzer) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcWriteTone(g.pinBuzzer, BUZZ_FREQ);
#else
    ledcWriteTone(g.buzzChannel, BUZZ_FREQ);
#endif
  } else {
    digitalWrite(g.pinBuzzer, HIGH);
  }
}

void buzzerOff(Gate &g) {
  if (g.passiveBuzzer) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcWriteTone(g.pinBuzzer, 0);
#else
    ledcWriteTone(g.buzzChannel, 0);
#endif
  } else {
    digitalWrite(g.pinBuzzer, LOW);
  }
}

void beep(Gate &g, unsigned long ms) {
  buzzerOn(g);
  g.buzzerOffAt = millis() + ms;
}

void updateBuzzer(Gate &g) {
  if (g.buzzerOffAt && millis() >= g.buzzerOffAt) {
    buzzerOff(g);
    g.buzzerOffAt = 0;
  }
}

void setState(Gate &g, GateState s) {
  g.state = s;
  g.stateStart = millis();
}

bool irDetected(Gate &g) {
  bool v = digitalRead(g.pinIR);
  bool activeLow = g.isEntry ? ENTRY_IR_ACTIVE_LOW : EXIT_IR_ACTIVE_LOW;
  return activeLow ? !v : v;
}

int findCard(const String &uid) {
  for (int i = 0; i < cardCount; i++)
    if (uid.equalsIgnoreCase(cards[i].uid))
      return i;
  return -1;
}

bool readCard(Gate &g, String &uidOut) {
  if (!g.rfid.PICC_IsNewCardPresent())
    return false;
  if (!g.rfid.PICC_ReadCardSerial())
    return false;
  uidOut = "";
  for (byte i = 0; i < g.rfid.uid.size; i++) {
    if (g.rfid.uid.uidByte[i] < 0x10)
      uidOut += "0";
    uidOut += String(g.rfid.uid.uidByte[i], HEX);
  }
  uidOut.toUpperCase();
  g.rfid.PICC_HaltA(); // card must leave the field before it can be read again
  g.rfid.PCD_StopCrypto1();
  return true;
}

void openGate(Gate &g) { g.servo.write(SERVO_OPEN_ANGLE); }
void closeGate(Gate &g) { g.servo.write(SERVO_CLOSED_ANGLE); }

void logEvent(Gate &g, const char *event, const char *uid) {
  Serial.printf("{\"gate\":\"%s\",\"event\":\"%s\",\"uid\":\"%s\",\"free\":%d,"
                "\"reserved\":%d,\"inside\":%d,\"parked\":%d}\n",
                g.name, event, uid, freeSlots(), reservedCount(), insideCount(),
                parkedCount());
  // Non-blocking queue to network worker
  enqueueDeviceEvent(g.name, event, uid, freeSlots(), reservedCount(), insideCount(), parkedCount());
}

void deny(Gate &g, const char *l1, const char *l2) {
  digitalWrite(g.pinGreen, LOW);
  digitalWrite(g.pinRed, HIGH);
  beep(g, 600);
  lcdShow(g, l1, l2);
  setState(g, G_MESSAGE);
}

// ===================== GATE LOGIC =====================
void showIdle(Gate &g) {
  if (g.isEntry) {
    if (freeSlots() == 0) {
      if (reservedCount() > 0) {
        lcdShow(g, "ENTRY (0/2 FREE)", "Reserved only");
      } else {
        lcdShow(g, "ENTRY (0/2 FREE)", "LOT FULL");
      }
    } else {
      char l1[17], l2[17];
      snprintf(l1, sizeof(l1), "Free:%d/%d (Res:%d)", freeSlots(), TOTAL_CAPACITY, reservedCount());
      snprintf(l2, sizeof(l2), "Tap your card   ");
      lcdShow(g, l1, l2);
    }
  } else {
    lcdShow(g, "EXIT GATE", "Tap your card");
  }
}

void handleGate(Gate &g) {
  updateBuzzer(g);

  switch (g.state) {

  // ---------------------------------------------------------------
  case G_IDLE: {
    // 1) Watch the IR for a stuck-blocked sensor while the gate is closed
    if (irDetected(g)) {
      if (g.irBlockedSince == 0)
        g.irBlockedSince = millis();
      if (!g.fault && millis() - g.irBlockedSince > IR_STUCK_IDLE_MS) {
        g.fault = true;
        digitalWrite(g.pinRed, HIGH);
        logEvent(g, "ir_stuck_blocked", "");
      }
    } else {
      g.irBlockedSince = 0;
      if (g.fault) {
        g.fault = false;
        digitalWrite(g.pinRed, LOW);
        logEvent(g, "ir_recovered", "");
      }
    }
    if (g.fault) {
      lcdShow(g, "OUT OF ORDER", "See staff");
      break;
    } // fail closed

    showIdle(g);

    // 2) Read a card
    String uid;
    if (!readCard(g, uid))
      break;
    unsigned long now = millis();

    // Double tap: same card again within DOUBLE_TAP_MS is ignored silently
    if (uid == g.lastUid && now - g.lastScan < DOUBLE_TAP_MS) {
      Serial.printf("[%s] double tap ignored: %s\n", g.name, uid.c_str());
      break;
    }
    g.lastUid = uid;
    g.lastScan = now;
    Serial.printf("[%s] card scanned: %s\n", g.name, uid.c_str());

    // 3) Decide
    int idx = findCard(uid);
    const char *ev = nullptr, *d1 = "", *d2 = "";

    if (idx < 0) {
      ev = "denied_unknown";
      d1 = "UNKNOWN CARD";
      d2 = "Access denied";
    } else if (g.isEntry) {
      bool isStaff = (strcmp(cards[idx].type, "staff") == 0);

      if (cards[idx].inside) {
        ev = "denied_already_inside";
        d1 = "ALREADY INSIDE";
        d2 = "Use exit gate";
      } else if (isStaff) {
        // Staff card: guaranteed space even when freeSlots() == 0,
        // UNLESS physical capacity is completely exhausted.
        if (physicalFree() <= 0) {
          ev = "denied_staff_physical_full";
          d1 = "PHYSICAL FULL";
          d2 = "See staff";
        }
      } else if (cards[idx].reserved) {
        // Guest reserved card: can enter even when freeSlots() == 0,
        // UNLESS physical space is completely blocked.
        if (physicalFree() <= 0) {
          ev = "denied_reserved_space_blocked";
          d1 = "SPACE BLOCKED";
          d2 = "See staff";
        }
      } else if (strcmp(cards[idx].type, "guest") == 0) {
        // Unassigned guest card: must be claimed/assigned by Admin first!
        ev = "denied_unassigned_guest";
        d1 = "CARD INACTIVE";
        d2 = "See Guardhouse";
      } else if (freeSlots() <= 0) {
        if (reservedCount() > 0) {
          ev = "denied_reserved_only";
          d1 = "LOT FULL";
          d2 = "Reserved only";
        } else {
          ev = "denied_full";
          d1 = "PARKING FULL";
          d2 = "Please wait";
        }
      }
    } else {
      if (!cards[idx].inside) {
        ev = "denied_not_inside";
        d1 = "NOT INSIDE";
        d2 = "Enter first";
      }
    }

    if (ev) {
      logEvent(g, ev, uid.c_str());
      deny(g, d1, d2);
      break;
    }

    // 4) Access granted
    g.pendingCard = idx;
    digitalWrite(g.pinRed, LOW);
    digitalWrite(g.pinGreen, HIGH);
    beep(g, 150);
    lcdShow(g,
            g.isEntry ? (cards[idx].reserved ? "RESERVED" : "WELCOME!")
                      : "GOODBYE!",
            cards[idx].owner);
    openGate(g);
    logEvent(g, "granted", uid.c_str());
    setState(g, G_WAIT_VEHICLE);
    break;
  }

  // ---------------------------------------------------------------
  case G_WAIT_VEHICLE:
    // Only transition if IR detection is real and not an initial bounce right as gate opens
    if (irDetected(g) && (millis() - g.stateStart > 400)) {
      g.irClearSince = 0;
      g.alarm = false;
      setState(g, G_VEHICLE_PASSING);
    } else if (millis() - g.stateStart > GATE_TIMEOUT_MS) {
      closeGate(g);
      digitalWrite(g.pinGreen, LOW);
      g.pendingCard = -1;
      lcdShow(g, "TIMED OUT", "Gate closed");
      logEvent(g, "timeout", "");
      g.timeoutStreak++;
      if (g.timeoutStreak == 3)
        logEvent(g, "ir_suspect", ""); // 3 timeouts in a row
      g.lastScan = millis();
      setState(g, G_MESSAGE);
    }
    break;

  // ---------------------------------------------------------------
  case G_VEHICLE_PASSING:
    if (irDetected(g)) {
      g.irClearSince = 0;
      if (!g.alarm && millis() - g.stateStart > PASSING_MAX_MS) {
        g.alarm = true;
        g.lastAlarm = 0;
        logEvent(g, "gate_blocked", "");
      }
      if (g.alarm) { // gate stays OPEN, alarm until cleared
        digitalWrite(g.pinRed, (millis() / 500) % 2);
        if (millis() - g.lastAlarm > 2000) {
          beep(g, 200);
          g.lastAlarm = millis();
        }
        lcdShow(g, "GATE BLOCKED", "Clear the gate");
      } else {
        lcdShow(g, "VEHICLE PASSING", "Please wait...");
      }
    } else {
      if (g.alarm) {
        g.alarm = false;
        digitalWrite(g.pinRed, LOW);
        logEvent(g, "gate_unblocked", "");
      }
      lcdShow(g, "VEHICLE PASSING", "Please wait...");
      if (g.irClearSince == 0)
        g.irClearSince = millis();
      if (millis() - g.irClearSince > CLEAR_DELAY_MS) {
        // Vehicle fully passed: NOW the transaction is recorded
        Card &c = cards[g.pendingCard];
        c.inside = g.isEntry;
        if (g.isEntry)
          c.reserved = false; // reservation used up
        saveCards();
        logEvent(g, g.isEntry ? "entered" : "exited", c.uid);
        g.pendingCard = -1;
        g.timeoutStreak = 0;
        g.lastScan = millis(); // protects against an immediate re-tap
        closeGate(g);
        digitalWrite(g.pinGreen, LOW);
        beep(g, 100);
        lcdShow(g, g.isEntry ? "Enjoy your stay" : "Safe travels!",
                "Gate closing");
        setState(g, G_MESSAGE);
      }
    }
    break;

  // ---------------------------------------------------------------
  case G_MESSAGE:
    if (millis() - g.stateStart > MESSAGE_MS) {
      digitalWrite(g.pinRed, LOW);
      digitalWrite(g.pinGreen, LOW);
      setState(g, G_IDLE);
    }
    break;
  }
}

// ===================== ULTRASONIC =====================
float readCm(uint8_t trig, uint8_t echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  unsigned long d = pulseIn(echo, HIGH, 25000);
  if (d == 0)
    return 999; // no echo
  return d * 0.0343 / 2.0;
}

void updateSlots() {
  if (millis() - lastUltra < 250)
    return;
  lastUltra = millis();

  uint8_t i = ultraTurn; // one sensor per cycle: they never interfere
  ultraTurn = (ultraTurn + 1) % 2;
  float d = (i == 0) ? readCm(L1_TRIG, L1_ECHO) : readCm(L2_TRIG, L2_ECHO);

  if (d >= 999) { // invalid reading
    if (!slotFault[i] && millis() - slotLastValid[i] > SENSOR_FAULT_MS) {
      slotFault[i] = true;
      slotOccupied[i] =
          false; // unknown: do not let a broken sensor affect counts
      slotCounter[i] = 0;
      Serial.printf("{\"fault\":\"ultrasonic\",\"slot\":\"L%d\"}\n", i + 1);
    }
    return;
  }

  slotLastValid[i] = millis();
  slotDist[i] = d;
  if (slotFault[i]) {
    slotFault[i] = false;
    Serial.printf("{\"recovered\":\"ultrasonic\",\"slot\":\"L%d\"}\n", i + 1);
  }

  float threshold = (i == 0) ? OCCUPIED_CM_L1 : OCCUPIED_CM_L2;
  bool nowOcc = d < threshold;
  if (nowOcc != slotOccupied[i]) {
    if (++slotCounter[i] >= 3) { // 3 matching readings = debounce
      slotOccupied[i] = nowOcc;
      slotCounter[i] = 0;
      Serial.printf(
          "{\"slot\":\"L%d\",\"occupied\":%s,\"cm\":%.1f,\"free\":%d}\n", i + 1,
          nowOcc ? "true" : "false", d, freeSlots());
    }
  } else {
    slotCounter[i] = 0;
  }
}

// ===================== RESERVATIONS =====================
void expireReservations() {
  for (int i = 0; i < cardCount; i++) {
    if (cards[i].reserved && (long)(millis() - cards[i].reservedUntil) >= 0) {
      cards[i].reserved = false;
      Serial.printf(
          "{\"reservation\":\"expired\",\"uid\":\"%s\",\"free\":%d}\n",
          cards[i].uid, freeSlots());
      enqueueDeviceEvent("SYSTEM", "reservation_expired", cards[i].uid, freeSlots(), reservedCount(), insideCount(), parkedCount());
    }
  }
}

// ===================== WARNINGS & STATUS =====================
void buildWarnings(char *out, size_t n) {
  out[0] = '\0';
  auto add = [&](const char *w) {
    if (out[0])
      strlcat(out, ",", n);
    strlcat(out, w, n);
  };
  if (entryGate.fault || exitGate.fault || entryGate.alarm || exitGate.alarm)
    add("gate_fault");
  if (slotFault[0] || slotFault[1])
    add("sensor_fault");
  if (parkedCount() > insideCount())
    add("parked_without_entry");
  if (entryGate.timeoutStreak >= 3 || exitGate.timeoutStreak >= 3)
    add("ir_suspect");
}

void checkWarnings() {
  static char last[96] = "";
  char now[96];
  buildWarnings(now, sizeof(now));
  if (strcmp(now, last) != 0) {
    Serial.printf("{\"warning\":\"%s\"}\n", now[0] ? now : "none");
    strcpy(last, now);
  }
}

const char *slotWord(int i) {
  return slotFault[i] ? "fault" : (slotOccupied[i] ? "occupied" : "empty");
}

unsigned long lastStatus = 0;
void printStatus(bool force = false) {
  if (!force && millis() - lastStatus < 5000)
    return;
  lastStatus = millis();
  int emptyMonitored = 0;
  for (int i = 0; i < 2; i++)
    if (!slotFault[i] && !slotOccupied[i])
      emptyMonitored++;
  int incoming = min(inTransitCount() + reservedCount(), emptyMonitored);
  char w[96];
  buildWarnings(w, sizeof(w));
  Serial.printf(
      "{\"status\":{\"capacity\":%d,\"inside\":%d,\"parked\":%d,\"in_transit\":"
      "%d,"
      "\"reserved\":%d,\"free\":%d,\"L1\":\"%s\",\"L2\":\"%s\",\"incoming_"
      "monitored\":%d,"
      "\"entry_gate\":\"%s\",\"exit_gate\":\"%s\",\"warning\":\"%s\"}}\n",
      TOTAL_CAPACITY, insideCount(), parkedCount(), inTransitCount(),
      reservedCount(), freeSlots(), slotWord(0), slotWord(1), incoming,
      entryGate.fault ? "fault" : "ok", exitGate.fault ? "fault" : "ok", w);

  // Feed heartbeat telemetry to network worker
  updateNetworkHeartbeat(TOTAL_CAPACITY, insideCount(), parkedCount(), inTransitCount(),
                         reservedCount(), freeSlots(), slotWord(0), slotWord(1),
                         entryGate.fault ? "fault" : "ok", exitGate.fault ? "fault" : "ok", w);
}

// ===================== SERIAL COMMANDS (website will send the same)
// =====================
void reply(const char *cmd, const char *uid, const char *result,
           const char *reason) {
  Serial.printf("{\"cmd\":\"%s\",\"uid\":\"%s\",\"result\":\"%s\",\"reason\":"
                "\"%s\",\"free\":%d}\n",
                cmd, uid, result, reason, freeSlots());
}

void handleCommand(String line) {
  line.trim();
  if (line.length() == 0)
    return;
  line.toUpperCase();

  int sp = line.indexOf(' ');
  String cmd = (sp < 0) ? line : line.substring(0, sp);
  String rest = (sp < 0) ? "" : line.substring(sp + 1);
  rest.trim();

  if (cmd == "STATUS") {
    printStatus(true);
    return;
  }

  if (cmd == "RESET") {
    for (int i = 0; i < cardCount; i++) {
      cards[i].inside = false;
      cards[i].reserved = false;
    }
    saveCards();
    reply("RESET", "", "ok", "");
    return;
  }

  String uid = rest;
  long secs = DEFAULT_RESERVE_SEC;
  int sp2 = rest.indexOf(' ');
  if (sp2 >= 0) {
    uid = rest.substring(0, sp2);
    secs = rest.substring(sp2 + 1).toInt();
    if (secs <= 0)
      secs = DEFAULT_RESERVE_SEC;
  }

  if (cmd == "RES" || cmd == "CANCEL" || cmd == "SETIN" || cmd == "SETOUT") {
    int idx = findCard(uid);
    if (idx < 0) {
      reply(cmd.c_str(), uid.c_str(), "rejected", "unknown_card");
      return;
    }
    Card &c = cards[idx];

    if (cmd == "RES") {
      if (c.inside) {
        reply("RES", c.uid, "rejected", "already_inside");
        return;
      }
      if (!c.reserved && freeSlots() <= 0) {
        reply("RES", c.uid, "rejected", "no_space");
        return;
      }
      c.reserved = true; // new or refreshed hold
      c.reservedUntil = millis() + (unsigned long)secs * 1000UL;
      reply("RES", c.uid, "ok", "");
    } else if (cmd == "CANCEL") {
      c.reserved = false;
      reply("CANCEL", c.uid, "ok", "");
    } else if (cmd == "SETIN") {
      c.inside = true;
      c.reserved = false;
      saveCards();
      reply("SETIN", c.uid, "ok", "");
    } else {
      c.inside = false;
      saveCards();
      reply("SETOUT", c.uid, "ok", "");
    }
    return;
  }

  reply(cmd.c_str(), "", "rejected", "unknown_command");
}

void handleSerial() {
  static String buf = "";
  while (Serial.available()) {
    char ch = Serial.read();
    if (ch == '\n' || ch == '\r') {
      if (buf.length())
        handleCommand(buf);
      buf = "";
    } else if (buf.length() < 64)
      buf += ch;
  }
}

// ===================== NETWORK CALLBACKS =====================
void onRemoteCardsSynced(const String &jsonPayload) {
  // Simple JSON parsing of cards list without pulling heavy dynamic JSON allocators
  int cardsIdx = jsonPayload.indexOf("\"cards\":[");
  if (cardsIdx < 0) return;

  int cur = cardsIdx;
  int count = 0;
  Card tempCards[MAX_CARDS];

  while ((cur = jsonPayload.indexOf("{\"uid\":\"", cur)) >= 0 && count < MAX_CARDS) {
    int uStart = cur + 8;
    int uEnd = jsonPayload.indexOf("\"", uStart);
    if (uEnd < 0) break;
    String uid = jsonPayload.substring(uStart, uEnd);

    String owner = "User";
    int oIdx = jsonPayload.indexOf("\"owner\":\"", cur);
    if (oIdx >= 0 && oIdx < jsonPayload.indexOf("}", cur)) {
      int oEnd = jsonPayload.indexOf("\"", oIdx + 9);
      owner = jsonPayload.substring(oIdx + 9, oEnd);
    }

    String type = "guest";
    int tIdx = jsonPayload.indexOf("\"type\":\"", cur);
    if (tIdx >= 0 && tIdx < jsonPayload.indexOf("}", cur)) {
      int tEnd = jsonPayload.indexOf("\"", tIdx + 8);
      type = jsonPayload.substring(tIdx + 8, tEnd);
    }

    bool reserved = false;
    int rIdx = jsonPayload.indexOf("\"reserved\":", cur);
    if (rIdx >= 0 && rIdx < jsonPayload.indexOf("}", cur)) {
      reserved = jsonPayload.substring(rIdx + 11).startsWith("true");
    }

    long rSec = 900;
    int sIdx = jsonPayload.indexOf("\"reserve_sec\":", cur);
    if (sIdx >= 0 && sIdx < jsonPayload.indexOf("}", cur)) {
      rSec = jsonPayload.substring(sIdx + 14).toInt();
    }

    // Preserve local 'inside' status if card was already present
    bool wasInside = false;
    int oldIdx = findCard(uid);
    if (oldIdx >= 0) {
      wasInside = cards[oldIdx].inside;
    }

    strlcpy(tempCards[count].uid, uid.c_str(), sizeof(tempCards[count].uid));
    strlcpy(tempCards[count].owner, owner.c_str(), sizeof(tempCards[count].owner));
    strlcpy(tempCards[count].type, type.c_str(), sizeof(tempCards[count].type));
    tempCards[count].inside = wasInside;
    tempCards[count].reserved = reserved;
    tempCards[count].reservedUntil = reserved ? (millis() + (unsigned long)rSec * 1000UL) : 0;
    count++;

    cur = jsonPayload.indexOf("}", cur) + 1;
  }

  if (count > 0) {
    // Merge synced cards into existing cards so compiled local cards (student/staff)
    // are never deleted or wiped out if the server only returns a subset!
    for (int i = 0; i < count; i++) {
      int existingIdx = findCard(tempCards[i].uid);
      if (existingIdx >= 0) {
        strlcpy(cards[existingIdx].owner, tempCards[i].owner, sizeof(cards[existingIdx].owner));
        strlcpy(cards[existingIdx].type, tempCards[i].type, sizeof(cards[existingIdx].type));
        cards[existingIdx].reserved = tempCards[i].reserved;
        cards[existingIdx].reservedUntil = tempCards[i].reservedUntil;
      } else if (cardCount < MAX_CARDS) {
        cards[cardCount] = tempCards[i];
        cardCount++;
      }
    }
    saveCards();
    Serial.printf("[NET] Synced %d remote cards (total active cards: %d)\n", count, cardCount);
  }
}

void onRemoteCommandReceived(const char *cmd, const char *uid, long param) {
  char cmdLine[64];
  if (param > 0) {
    snprintf(cmdLine, sizeof(cmdLine), "%s %s %ld", cmd, uid ? uid : "", param);
  } else {
    snprintf(cmdLine, sizeof(cmdLine), "%s %s", cmd, uid ? uid : "");
  }
  Serial.printf("[NET] Executing remote command: %s\n", cmdLine);
  handleCommand(String(cmdLine));
}

// Drain inbound command queue from FreeRTOS task
void processInboundCommands() {
  if (!inboundCommandQueue) return;
  InboundCommand ibc;
  while (xQueueReceive(inboundCommandQueue, &ibc, 0) == pdTRUE) {
    onRemoteCommandReceived(ibc.cmd, ibc.uid, ibc.param);
  }
}

// ===================== SETUP / LOOP =====================
void setupGate(Gate &g) {
  pinMode(g.pinGreen, OUTPUT);
  pinMode(g.pinRed, OUTPUT);
  pinMode(g.pinIR, INPUT);
  digitalWrite(g.pinGreen, LOW);
  digitalWrite(g.pinRed, LOW);
  if (g.passiveBuzzer) {
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcAttachChannel(g.pinBuzzer, BUZZ_FREQ, 8, g.buzzChannel);
#else
    ledcSetup(g.buzzChannel, BUZZ_FREQ, 8);
    ledcAttachPin(g.pinBuzzer, g.buzzChannel);
#endif
  } else {
    pinMode(g.pinBuzzer, OUTPUT);
  }
  buzzerOff(g);
  g.servo.setPeriodHertz(50);
  g.servo.attach(g.pinServo, 500, 2400);
  closeGate(g);
  g.lcd.init();
  g.lcd.backlight();
  g.lcd.clear();
}

void setup() {
  Serial.begin(115200);
  loadCards();
  Wire.begin(21, 22);
  SPI.begin(18, 19, 23);

  pinMode(L1_TRIG, OUTPUT);
  pinMode(L1_ECHO, INPUT);
  pinMode(L2_TRIG, OUTPUT);
  pinMode(L2_ECHO, INPUT);
  slotLastValid[0] = slotLastValid[1] = millis();

  setupGate(entryGate);
  setupGate(exitGate);

  entryGate.rfid.PCD_Init(); // hard reset (also resets the exit reader via the
                             // shared RST line)
  delay(50);
  exitGate.rfid.PCD_Init(); // soft reset
  Serial.println("Entry RC522:");
  entryGate.rfid.PCD_DumpVersionToSerial();
  Serial.println("Exit RC522:");
  exitGate.rfid.PCD_DumpVersionToSerial();

  Serial.println("System ready. Commands: RES <uid> [sec] | CANCEL <uid> | "
                 "SETIN <uid> | SETOUT <uid> | RESET | STATUS");
  
  // Launch Wi-Fi and HTTPS FreeRTOS background task on Core 0
  startNetworkWorker();

  printStatus(true);
}

void loop() {
  processInboundCommands();
  updateSlots();
  handleSerial();
  expireReservations();
  handleGate(entryGate);
  handleGate(exitGate);
  checkWarnings();
  printStatus();
}
