#ifndef NETWORK_TASK_H
#define NETWORK_TASK_H

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include "config.h"
#include "time_sync.h"

// Telemetry event struct queued by gates
struct OutboxEvent {
  char eventId[40];
  char gate[10];
  char event[32];
  char uid[16];
  int free;
  int reserved;
  int inside;
  int parked;
};

// Command received from backend to execute locally
struct InboundCommand {
  char cmd[16];
  char uid[16];
  long param;
};

// FreeRTOS Queues
extern QueueHandle_t outboxQueue;
extern QueueHandle_t inboundCommandQueue;

// Callbacks implemented in main sketch
void onRemoteCardsSynced(const String &jsonPayload);
void onRemoteCommandReceived(const char *cmd, const char *uid, long param);

// Starts Wi-Fi, NTP and network worker FreeRTOS task on Core 0
void startNetworkWorker();

// Enqueue event from gate state machine (non-blocking, safe to call from loop/Core 1)
void enqueueDeviceEvent(const char *gate, const char *event, const char *uid,
                        int freeCount, int resCount, int insCount, int prkCount);

// Enqueue status heartbeat data
void updateNetworkHeartbeat(int cap, int ins, int prk, int inTrans, int res,
                            int freeCnt, const char *l1, const char *l2,
                            const char *entryG, const char *exitG, const char *warn);

#endif // NETWORK_TASK_H
