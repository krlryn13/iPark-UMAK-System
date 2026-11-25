#include "network_task.h"

#define OUTBOX_QUEUE_SIZE 32
#define INBOUND_QUEUE_SIZE 8

QueueHandle_t outboxQueue = nullptr;
QueueHandle_t inboundCommandQueue = nullptr;

// Heartbeat buffer protected by mutex
static portMUX_TYPE heartbeatMux = portMUX_INITIALIZER_UNLOCKED;
static char hbJson[384] = "";
static bool hbPending = false;
static uint32_t eventCounter = 0;

void enqueueDeviceEvent(const char *gate, const char *event, const char *uid,
                        int freeCount, int resCount, int insCount, int prkCount) {
  if (!outboxQueue) return;

  OutboxEvent ev;
  eventCounter++;
  snprintf(ev.eventId, sizeof(ev.eventId), "ESP32-%lu-%u", millis(), eventCounter);
  strlcpy(ev.gate, gate ? gate : "GATE", sizeof(ev.gate));
  strlcpy(ev.event, event ? event : "unknown", sizeof(ev.event));
  strlcpy(ev.uid, uid ? uid : "", sizeof(ev.uid));
  ev.free = freeCount;
  ev.reserved = resCount;
  ev.inside = insCount;
  ev.parked = prkCount;

  // Non-blocking send: if queue is full, drop oldest or drop event to never stall gates
  if (xQueueSend(outboxQueue, &ev, 0) != pdTRUE) {
    Serial.println("[NET] Warning: outbox queue full, dropping event to protect gate timing.");
  }
}

void updateNetworkHeartbeat(int cap, int ins, int prk, int inTrans, int res,
                            int freeCnt, const char *l1, const char *l2,
                            const char *entryG, const char *exitG, const char *warn) {
  portENTER_CRITICAL(&heartbeatMux);
  snprintf(hbJson, sizeof(hbJson),
           "{\"capacity\":%d,\"inside\":%d,\"parked\":%d,\"in_transit\":%d,"
           "\"reserved\":%d,\"free\":%d,\"L1\":\"%s\",\"L2\":\"%s\","
           "\"entry_gate\":\"%s\",\"exit_gate\":\"%s\",\"warning\":\"%s\"}",
           cap, ins, prk, inTrans, res, freeCnt, l1, l2, entryG, exitG, warn ? warn : "");
  hbPending = true;
  portEXIT_CRITICAL(&heartbeatMux);
}

// Background network worker task running on Core 0
static void networkWorkerTask(void *param) {
  Serial.println("[NET] Network FreeRTOS task started on Core 0.");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long lastWifiCheck = 0;
  unsigned long lastHeartbeat = 0;
  unsigned long lastCardSync = 0;

  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  secureClient.setInsecure(); // For self-signed or dev HTTPS certs

  for (;;) {
    unsigned long now = millis();

    // 1. Maintain Wi-Fi connection
    if (WiFi.status() != WL_CONNECTED) {
      if (now - lastWifiCheck > 8000) {
        lastWifiCheck = now;
        Serial.printf("[NET] Connecting to Wi-Fi '%s'...\n", WIFI_SSID);
        WiFi.reconnect();
      }
      vTaskDelay(pdMS_TO_TICKS(500));
      continue;
    }

    // Initialize NTP once connected
    static bool ntpStarted = false;
    if (!ntpStarted) {
      initNtpTime();
      ntpStarted = true;
      Serial.printf("[NET] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    }

    // 2. Flush queued offline/online events (HTTP POST /api/device/events)
    OutboxEvent ev;
    while (xQueueReceive(outboxQueue, &ev, 0) == pdTRUE) {
      HTTPClient http;
      String url = String(USE_HTTPS ? "https://" : "http://") + SERVER_HOST + ":" + SERVER_PORT + "/api/device/events";
      
      if (USE_HTTPS) {
        http.begin(secureClient, url);
      } else {
        http.begin(plainClient, url);
      }

      http.setTimeout(2500); // Strict short timeout
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-API-KEY", DEVICE_API_KEY);

      char payload[256];
      snprintf(payload, sizeof(payload),
               "{\"event_id\":\"%s\",\"gate\":\"%s\",\"event\":\"%s\",\"uid\":\"%s\","
               "\"free\":%d,\"reserved\":%d,\"inside\":%d,\"parked\":%d}",
               ev.eventId, ev.gate, ev.event, ev.uid, ev.free, ev.reserved, ev.inside, ev.parked);

      int httpCode = http.POST(payload);
      if (httpCode > 0) {
        Serial.printf("[NET] Ingested event %s: HTTP %d\n", ev.eventId, httpCode);
      } else {
        Serial.printf("[NET] Failed event POST %s (%s). Re-queueing.\n", ev.eventId, http.errorToString(httpCode).c_str());
        // Put back in queue if failed
        xQueueSendToFront(outboxQueue, &ev, 0);
        http.end();
        break; // Stop flushing this turn if network is dropping
      }
      http.end();
      vTaskDelay(pdMS_TO_TICKS(50));
    }

    // 3. Send Heartbeat & retrieve pending commands (every 3 seconds)
    if (now - lastHeartbeat >= 3000) {
      lastHeartbeat = now;
      char currentHb[384] = "";
      portENTER_CRITICAL(&heartbeatMux);
      if (hbPending) {
        strlcpy(currentHb, hbJson, sizeof(currentHb));
        hbPending = false;
      }
      portEXIT_CRITICAL(&heartbeatMux);

      if (strlen(currentHb) > 0) {
        HTTPClient http;
        String url = String(USE_HTTPS ? "https://" : "http://") + SERVER_HOST + ":" + SERVER_PORT + "/api/device/heartbeat";
        if (USE_HTTPS) http.begin(secureClient, url);
        else http.begin(plainClient, url);

        http.setTimeout(2500);
        http.addHeader("Content-Type", "application/json");
        http.addHeader("X-API-KEY", DEVICE_API_KEY);

        int httpCode = http.POST(currentHb);
        if (httpCode == 200) {
          String resp = http.getString();
          // Simple command parse from response JSON e.g. "commands":[{"command":"RES","uid":"..."}]
          int cmdIdx = resp.indexOf("\"commands\":[");
          if (cmdIdx >= 0) {
            int cur = cmdIdx;
            while ((cur = resp.indexOf("{\"id\":", cur)) >= 0) {
              int cName = resp.indexOf("\"command\":\"", cur);
              if (cName < 0) break;
              int cNameEnd = resp.indexOf("\"", cName + 11);
              String cmd = resp.substring(cName + 11, cNameEnd);

              String uid = "";
              int uIdx = resp.indexOf("\"uid\":\"", cur);
              if (uIdx >= 0 && uIdx < resp.indexOf("}", cur)) {
                int uEnd = resp.indexOf("\"", uIdx + 7);
                uid = resp.substring(uIdx + 7, uEnd);
              }

              long param = 900;
              int pIdx = resp.indexOf("\"param\":", cur);
              if (pIdx >= 0 && pIdx < resp.indexOf("}", cur)) {
                param = resp.substring(pIdx + 8).toInt();
              }

              InboundCommand ibc;
              strlcpy(ibc.cmd, cmd.c_str(), sizeof(ibc.cmd));
              strlcpy(ibc.uid, uid.c_str(), sizeof(ibc.uid));
              ibc.param = param;
              xQueueSend(inboundCommandQueue, &ibc, 0);

              cur = resp.indexOf("}", cur) + 1;
            }
          }
        }
        http.end();
      }
    }

    // 4. Poll and Sync Active Cards list from Backend (every 8 seconds)
    if (now - lastCardSync >= 8000) {
      lastCardSync = now;
      HTTPClient http;
      String url = String(USE_HTTPS ? "https://" : "http://") + SERVER_HOST + ":" + SERVER_PORT + "/api/device/sync-cards";
      if (USE_HTTPS) http.begin(secureClient, url);
      else http.begin(plainClient, url);

      http.setTimeout(3000);
      http.addHeader("X-API-KEY", DEVICE_API_KEY);

      int httpCode = http.GET();
      if (httpCode == 200) {
        String resp = http.getString();
        onRemoteCardsSynced(resp);
      }
      http.end();
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void startNetworkWorker() {
  outboxQueue = xQueueCreate(OUTBOX_QUEUE_SIZE, sizeof(OutboxEvent));
  inboundCommandQueue = xQueueCreate(INBOUND_QUEUE_SIZE, sizeof(InboundCommand));

  // Run on Core 0 so loop()/gates on Core 1 are completely isolated from network latency
  xTaskCreatePinnedToCore(
    networkWorkerTask,
    "NetWorker",
    8192,
    nullptr,
    1,
    nullptr,
    0
  );
}
