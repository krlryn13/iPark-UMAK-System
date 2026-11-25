# Parking Diorama: System Rules and Integration Task

## Firmware
`firmware/parking_diorama/parking_diorama.ino` (ESP32). Read its header comment first.
- ENTRY gate and EXIT gate, each with RFID, LCD, servo, IR sensor, LEDs, buzzer.
- 2 ultrasonic sensors monitor 2 real parking slots (Level 1, Level 2).
- Prints JSON events over Serial. Serial commands: `RES <uid> [sec]`, `CANCEL <uid>`, `SETIN <uid>`, `SETOUT <uid>`, `RESET`, `STATUS`.
- Cards are hardcoded in `cards[]`. Reservations are kept in RAM only.

## Core principles (keep these)
1. The GATE decides entry/exit locally. It must keep working with no Wi-Fi or website.
2. The ESP32 owns the free-space count: cars through entry - cars through exit - held spaces. The website only mirrors it and never computes its own.
3. A card tap alone never counts. The IR sensor confirms a vehicle really passed.
4. Ultrasonic sensors are informational only (which slot is occupied).

## Business rules
1. STAFF cards are permanent and linked to the staff member's account in the database. They are never claimed or surrendered. Staff always have a guaranteed space: they can enter even when walk-in availability is 0.
2. GUEST/RESERVATION cards come from a physical pool. The guest reserves on the website, claims a physical card (linked to the reservation), and surrenders it at the end (unlinked, back to the pool). A reserved guest can also enter when walk-in availability is 0.
3. Safety: a guaranteed entry must never exceed physical capacity. If the lot is physically full, deny and flag it for an admin.
4. Walk-in availability = capacity - cars inside - held spaces (staff holds + active reservations). Pick the simplest way to count staff holds and explain the choice in the report.
5. No-show reservations expire. A reservation can only be created when there is space. Two people must never reserve the last space at the same time (handle the race).
6. Extra floors/slots on the website are simulated. Only the 2 ultrasonic slots are real. Mark simulated ones clearly. Capacity is one shared config value.

## Scenarios to audit
Guest reserves but never claims; claims but never arrives; guest loses or never returns the card; staff account deactivated while the card is valid; staff vs guest competing for the last space; double tap; entering and leaving without parking; leaving a slot and coming back; two reservations for the last space at once; ESP32 offline; website offline; duplicate or out-of-order events after reconnecting; ESP32 reboot mid-transaction; website and ESP32 disagreeing on who is inside; admin manual corrections.

## Work to do (single pass, be token-efficient)
1. Create a git branch (or backup) first.
2. AUDIT the website (schema, routes, reservation and availability logic, card handling) against the rules and the firmware.
3. FIX/IMPROVE: apply changes that are clearly right. Data model for cards (type, status) and reservation lifecycle: reserved -> claimed -> inside -> exited -> returned, plus expired/cancelled. For risky judgment calls, pick the safest option and list it in the report.
4. BACKEND: device API with an API-key header (key in env/config, not committed), idempotent event ingestion (unique event IDs so retries never double count), card/reservation sync endpoint, heartbeat/status endpoint, admin override endpoint. The website shows live status, with "device offline" when there is no heartbeat for about 15 seconds, plus an admin page for events and warnings (sensor_fault, gate_fault, parked_without_entry, ir_suspect).
5. FIRMWARE: add Wi-Fi, HTTPS and NTP in SEPARATE files. Keep the existing gate logic intact. CRITICAL: network calls must NEVER block the gates. Use a separate FreeRTOS task with a queue, short timeouts, auto-reconnect, and an offline event queue that is sent after reconnecting. The ESP32 sends events by HTTPS POST and polls the backend every few seconds for cards, reservations, and commands. Replace hardcoded `cards[]` with a synced list (UID, type, status, expiry) cached in flash so the gates work after a reboot with no website. Keep the Serial commands for testing. Credentials, server URL and API key go in a gitignored `config.h`, with a committed `config.example.h`. If the server runs on localhost, say which LAN IP and settings the ESP32 needs.
6. FINAL REPORT (short): problems found and changed, decisions to double check, files changed, how to run it, and a test checklist for the scenarios above (what I should see on the LCDs, the website and the Serial Monitor).
