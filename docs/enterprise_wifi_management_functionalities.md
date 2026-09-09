# Wi-Fi Device Monitor & Network Control System — Functional Specifications

## 1. System Overview & Core Purpose
This system is built specifically for **Wi-Fi owners** (homeowners, families, landlords, office managers, cafes, and small-to-medium businesses) who want complete visibility and absolute control over every device connected to their Wi-Fi network.

The system acts as a **Network Sentinel & Access Controller**, giving the owner an intuitive interface to see who is on their network, what each device is doing, and the power to restrict, pause, or remove any device with a single click.

---

## 2. Core Functional Requirements

### A. Connected Client Discovery & Real-Time Inventory
- **Real-Time Client Count:**
  - Live indicator of active connected devices vs. offline/past devices.
  - Distinction between recognized devices and new/unknown devices.
- **Detailed Device Identification:**
  - **Device Name / Hostname:** Hostname resolution (e.g., "John-iPhone", "Living-Room-TV", "MacBook-Pro"). Custom nickname assignment by the owner (e.g., "Dad's Work Laptop").
  - **Device Category & Hardware Vendor:** Automatic OUI MAC lookup identifying manufacturer (Apple, Samsung, Intel, Sony, TP-Link, etc.) and device type (Phone, PC, Console, Smart TV, IoT).
  - **Network Identity:** Local IP address (IPv4 and IPv6) and physical MAC address.
  - **Connection Status:** Signal strength (RSSI/dBm), connection duration, and active link speed.

---

### B. Proximity & Location Tracking
- **Physical Proximity Estimation:**
  - Signal attenuation (RSSI) tracking to estimate whether the device is very close (same room), medium distance, or edge of coverage.
- **Node / Access Point Location (for multi-router / mesh systems):**
  - Pinpoints which specific room or mesh node the device is connected to (e.g., "Master Bedroom Node", "Office Router").
- **Presence Timeline & Connection Logs:**
  - Log of arrival and departure times (when the device connected to the Wi-Fi and when it disconnected/left the premises).

---

### C. Traffic, Browsing & Search Activity Monitoring
- **Domain & Website Visit History:**
  - Real-time logging of all visited websites and domains per device (e.g., `youtube.com`, `instagram.com`, `reddit.com`, `roblox.com`).
  - Timestamps, visit frequency, and active duration spent on specific domains.
- **Search Query & Activity Insights:**
  - Capture and classification of search engine activities and categories (e.g., queries conducted across search engines, video searches, topic categories).
  - Categorization of traffic: Streaming, Social Media, Gaming, Shopping, Adult Content, Work Tools, Educational.
- **Data & Bandwidth Consumption:**
  - Live upload and download speed per device (KB/s, MB/s).
  - Total data consumed (Daily, Weekly, Monthly) per device to identify bandwidth hogs.

---

### D. Device Control, Restrictions & Internet Pausing
- **One-Tap Internet Pause (Temporary Access Cut):**
  - Owner can freeze or pause internet access for any specific device instantly.
  - The device remains associated with Wi-Fi, but all WAN/Internet access is blocked.
  - Easy 1-click unpause to restore access immediately.
- **Device Kick / Disconnect:**
  - Ability to forcefully disconnect/kick any device off the Wi-Fi network.
- **Permanent or Timed Blacklist / Ban:**
  - Prevent specified MAC addresses from accessing the Wi-Fi or routing traffic.
- **Scheduled Access & Bedtime Rules:**
  - Set internet curfews or schedules per device (e.g., "Kids' Tablets turn off internet at 9:00 PM on weekdays").
- **Bandwidth Throttling / Speed Limiting:**
  - Throttle bandwidth on specific devices to ensure critical devices get priority.

---

### E. Security, Alerts & Owner Notifications
- **New Device Alert:**
  - Instant notification whenever an unrecognized device connects to the Wi-Fi.
- **Suspicious Activity Alert:**
  - Alerts for attempts to visit malicious domains, phishing sites, or unauthorized categories.
- **Bandwidth Spike Alerts:**
  - Alerts if a device is saturating network bandwidth.

---

## 3. Owner Dashboard & User Experience
- **Single-Screen Overview:**
  - Clean, modern dashboard showing total active devices, current total bandwidth usage, and real-time activity stream.
- **Per-Device Profile Card:**
  - Clicking any device opens its profile: Device name, IP, MAC, live speed, today's data used, list of visited sites/searches, and quick action buttons (**Pause Internet**, **Throttle**, **Remove/Block**).
- **Search & Activity Timeline:**
  - Searchable audit log: Filter by device, category, or time range.
