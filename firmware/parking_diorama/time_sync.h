#ifndef TIME_SYNC_H
#define TIME_SYNC_H

#include <Arduino.h>
#include <time.h>
#include "config.h"

inline void initNtpTime() {
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  Serial.println("[NTP] NTP time sync initialized (UTC+8).");
}

inline bool isTimeSynchronized() {
  time_t now = time(nullptr);
  return now > 1672531200; // Greater than Jan 1, 2023
}

inline String getFormattedIsoTime() {
  time_t now;
  time(&now);
  struct tm timeinfo;
  if (!localtime_r(&now, &timeinfo) || now < 1672531200) {
    // Fallback using millis() if NTP not yet set
    char buf[32];
    snprintf(buf, sizeof(buf), "BOOT+%lu", millis());
    return String(buf);
  }
  char buf[32];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buf);
}

#endif // TIME_SYNC_H
