#ifndef CONFIG_EXAMPLE_H
#define CONFIG_EXAMPLE_H

// Wi-Fi Credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Backend Server Configuration
// Use your machine's LAN IP (e.g., "192.168.1.13") when running Node backend on localhost.
// Do NOT use "localhost" or "127.0.0.1" because ESP32 resolves localhost to itself.
#define SERVER_HOST "192.168.1.13"
#define SERVER_PORT 5000
#define USE_HTTPS false // Set true if using HTTPS/TLS port 443

// Device API Authentication Key (Matches backend DEVICE_API_KEY)
#define DEVICE_API_KEY "ipark_diorama_secure_api_key_2026"

// NTP Time Server (Philippine Standard Time UTC+8)
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET_SEC 28800 // 8 hours * 3600
#define DAYLIGHT_OFFSET_SEC 0

#endif // CONFIG_EXAMPLE_H
