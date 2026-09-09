# Wi-Fi Sentinel — Comprehensive API & UI Verification Testing Tasks

> **Scope & Purpose:**
> This document specifies every test task required to validate the entire system end-to-end. For each API endpoint and real-time stream, it defines the exact request payload sent from the frontend, the expected API response, edge-case failure scenarios, and the precise UI state changes that must be visually verified on the dashboard.

---

## Testing Dashboard Summary
- **Total Testing Tasks:** 85 Exhaustive Test Tasks
- **Categories:**
  - 1. System & Gateway Health Endpoints (Tasks TST-001 to TST-006)
  - 2. Client Device Discovery & Inventory Endpoints (Tasks TST-007 to TST-018)
  - 3. Device Access & Network Control Endpoints (Tasks TST-019 to TST-036)
  - 4. Bandwidth Throttling & QoS Endpoints (Tasks TST-037 to TST-044)
  - 5. Traffic, Visited Domains & Categorization Endpoints (Tasks TST-045 to TST-056)
  - 6. Curfews, Bedtime & Scheduling Endpoints (Tasks TST-057 to TST-066)
  - 7. Mesh Node & Topology Endpoints (Tasks TST-067 to TST-072)
  - 8. Security, Threat & Alert Endpoints (Tasks TST-073 to TST-078)
  - 9. Real-Time WebSocket Telemetry & UI Synchronization (Tasks TST-079 to TST-085)

---

## 1. System & Gateway Health Endpoints

### TST-001: Gateway Health & Telemetry Status (`GET /api/system/status`)
- **Method & Route:** `GET /api/system/status`
- **Frontend Trigger:** Initial application load & periodic 30s background poll.
- **Request Payload:** None (`Headers: Authorization: Bearer <token>, Accept: application/json`)
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "online",
    "gatewayIp": "192.168.1.1",
    "wanIp": "203.0.113.45",
    "uptimeSeconds": 348210,
    "cpuUsagePercent": 14.2,
    "ramUsagePercent": 38.5,
    "firmwareVersion": "v2.4.1-sentinel",
    "activeBandwidth": {
      "downloadBps": 45821000,
      "uploadBps": 8420000
    },
    "clientCounts": {
      "total": 18,
      "active": 14,
      "paused": 2,
      "blocked": 2
    }
  }
  ```
- **UI Verification:**
  - Verify top header status dot turns vibrant green ("Gateway Online").
  - Verify WAN Speed Ticker updates to `45.8 MB/s ↓` and `8.4 MB/s ↑`.
  - Verify client counter pill displays `14 Active • 18 Total`.
  - In Settings/System card, verify CPU and RAM gauges reflect `14%` and `39%`.

### TST-002: Gateway Status - Gateway Disconnected / Degraded (`GET /api/system/status`)
- **Trigger:** Gateway offline or WAN cable unplugged simulation.
- **Error Response (`503 Service Unavailable`):**
  ```json
  {
    "status": "degraded",
    "error": "WAN link down",
    "code": "ERR_WAN_DISCONNECTED"
  }
  ```
- **UI Verification:**
  - Verify top header status dot turns pulsing amber/red ("WAN Link Down").
  - Verify sticky notification banner appears at the top: *"Gateway is unreachable or offline. Displaying cached state."*
  - Verify control buttons (Pause, Throttle) display disabled state to prevent orphaned commands.

---

## 2. Client Device Discovery & Inventory Endpoints

### TST-003: List All Connected & Historical Devices (`GET /api/devices`)
- **Method & Route:** `GET /api/devices?status=all`
- **Frontend Trigger:** Navigating to "Devices" view or initial app load.
- **Request Query Params:** `status=all&sort=speed&order=desc`
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": "dev_01",
      "mac": "F4:D4:88:5E:A1:22",
      "ip": "192.168.1.104",
      "ipv6": "fe80::f6d4:88ff:fe5e:a122",
      "hostname": "MacBook-Pro-16",
      "nickname": "Alex Work Laptop",
      "vendor": "Apple, Inc.",
      "category": "laptop",
      "status": "active",
      "signalDbm": -48,
      "meshNodeId": "node_01",
      "meshNodeName": "Office AP",
      "band": "5GHz",
      "linkSpeedMbps": 866,
      "currentDownloadBps": 12400000,
      "currentUploadBps": 1800000,
      "todayBytesTotal": 14820000000,
      "connectedAt": "2026-09-09T18:22:10Z",
      "isRandomizedMac": false,
      "isNew": false
    },
    {
      "id": "dev_02",
      "mac": "98:CD:AC:12:34:56",
      "ip": "192.168.1.118",
      "hostname": "iPhone-15",
      "nickname": "Kids Tablet",
      "vendor": "Apple, Inc.",
      "category": "phone",
      "status": "paused",
      "signalDbm": -67,
      "meshNodeId": "node_02",
      "meshNodeName": "Living Room Mesh",
      "band": "5GHz",
      "linkSpeedMbps": 433,
      "currentDownloadBps": 0,
      "currentUploadBps": 0,
      "todayBytesTotal": 2400000000,
      "connectedAt": "2026-09-09T20:15:00Z",
      "isRandomizedMac": true,
      "isNew": false
    }
  ]
  ```
- **UI Verification:**
  - Verify skeleton loaders disappear and device cards render cleanly.
  - Verify `Alex Work Laptop` shows Laptop icon, Apple badge, `-48 dBm` (4 full bars, green), `12.4 MB/s` download badge.
  - Verify `Kids Tablet` shows Phone icon, red "PAUSED" pill, `0 B/s`, and "Private Wi-Fi Address" warning chip.

### TST-004: Get Single Device Deep Telemetry (`GET /api/devices/:id`)
- **Method & Route:** `GET /api/devices/dev_01`
- **Frontend Trigger:** User clicks any device card or table row.
- **Success Response (`200 OK`):** Full profile with 60-second historical speed points, DHCP lease expiry, and category statistics.
- **UI Verification:**
  - Slide-over Drawer animates in smoothly from the right.
  - Verify device hardware details (MAC, IP, DHCP expiry, radio band) display in crisp data chips.
  - Verify mini live speed sparkline initializes without stutter.

### TST-005: Update Device Nickname (`PATCH /api/devices/:id`)
- **Method & Route:** `PATCH /api/devices/dev_01`
- **Frontend Trigger:** User clicks device title, types "Alex Studio M3", presses Enter.
- **Request Payload:**
  ```json
  {
    "nickname": "Alex Studio M3"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "dev_01",
    "nickname": "Alex Studio M3",
    "updatedAt": "2026-09-10T00:25:00Z"
  }
  ```
- **UI Verification:**
  - Verify optimistic UI: Name updates instantly in the UI before network return.
  - Verify subtle checkmark micro-animation confirms save.
  - Refresh device list and verify "Alex Studio M3" persists.

### TST-006: Update Device Nickname - Validation Error (`PATCH /api/devices/:id`)
- **Request Payload:** `{ "nickname": "" }` (empty string or >50 characters)
- **Error Response (`422 Unprocessable Entity`):**
  ```json
  {
    "error": "Nickname must be between 1 and 40 characters",
    "field": "nickname"
  }
  ```
- **UI Verification:**
  - Verify UI rolls back to previous nickname.
  - Verify red validation outline on input with toast: *"Invalid device name"*.

### TST-007: Update Device Category (`PATCH /api/devices/:id`)
- **Method & Route:** `PATCH /api/devices/dev_01`
- **Frontend Trigger:** User changes category dropdown from "Unknown" to "Gaming Console".
- **Request Payload:** `{ "category": "gaming_console" }`
- **Success Response (`200 OK`):** Returns updated device object.
- **UI Verification:**
  - Device icon immediately changes to Gamepad icon.
  - Category badge updates to "Gaming Console".

---

## 3. Device Access & Network Control Endpoints

### TST-008: Pause Internet Access for Device (`POST /api/devices/:id/pause`)
- **Method & Route:** `POST /api/devices/dev_01/pause`
- **Frontend Trigger:** User clicks "Pause Internet" button on device card or drawer.
- **Request Payload:**
  ```json
  {
    "reason": "manual_pause",
    "durationMinutes": 0
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "dev_01",
    "status": "paused",
    "pausedAt": "2026-09-10T00:26:10Z",
    "firewallRuleId": "fw_drop_F4D4885EA122"
  }
  ```
- **UI Verification:**
  - **Optimistic State:** Button immediately switches from "Pause" to "Resume" with amber loading spinner.
  - **Final State:** Badge switches to red "PAUSED" pill; live speed drops to `0 KB/s`.
  - Toast notification appears: *"Internet paused for Alex Work Laptop"*.
  - Device card border displays subtle red accent highlight.

### TST-009: Resume Internet Access for Device (`POST /api/devices/:id/resume`)
- **Method & Route:** `POST /api/devices/dev_01/resume`
- **Frontend Trigger:** User clicks "Resume Internet" button on a paused device.
- **Request Payload:** `{}`
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "dev_01",
    "status": "active",
    "resumedAt": "2026-09-10T00:27:00Z"
  }
  ```
- **UI Verification:**
  - Red "PAUSED" badge immediately reverts to green "ACTIVE" badge.
  - Button text returns to "Pause Internet".
  - Toast notification: *"Internet access restored for Alex Work Laptop"*.

### TST-010: Pause Internet - Failure / Timeout Rollback (`POST /api/devices/:id/pause`)
- **Trigger:** Network disconnect or router command failure simulation.
- **Error Response (`500 Internal Server Error`):**
  ```json
  {
    "error": "Failed to apply nftables WAN drop rule",
    "code": "ERR_FIREWALL_FAILURE"
  }
  ```
- **UI Verification:**
  - Verify UI automatically rolls back optimistic change.
  - Button returns to "Pause Internet".
  - Destructive error toast appears: *"Failed to pause internet: Router firewall error"*.

### TST-011: Force Disconnect / Kick Device Off Wi-Fi (`POST /api/devices/:id/kick`)
- **Method & Route:** `POST /api/devices/dev_01/kick`
- **Frontend Trigger:** User opens device options dropdown, clicks "Kick Off Wi-Fi", and confirms in Modal Dialog.
- **Request Payload:**
  ```json
  {
    "reason": "owner_action",
    "disassociateReasonCode": 8
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "dev_01",
    "mac": "F4:D4:88:5E:A1:22",
    "action": "deauthenticated",
    "timestamp": "2026-09-10T00:28:15Z"
  }
  ```
- **UI Verification:**
  - Confirmation Modal closes smoothly.
  - Device card fades to gray with "DISCONNECTED" badge.
  - Active device counter in header decrements by 1 immediately.
  - Toast notification: *"Alex Work Laptop has been kicked from the network"*.

### TST-012: Permanent MAC Blacklist / Block Device (`POST /api/devices/:id/block`)
- **Method & Route:** `POST /api/devices/dev_01/block`
- **Frontend Trigger:** User clicks "Ban / Block Permanently" in Confirm Dialog.
- **Request Payload:**
  ```json
  {
    "mac": "F4:D4:88:5E:A1:22",
    "notes": "Unrecognized rogue device"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "id": "dev_01",
    "mac": "F4:D4:88:5E:A1:22",
    "status": "blocked",
    "blockedAt": "2026-09-10T00:29:00Z"
  }
  ```
- **UI Verification:**
  - Device card moves from "Active Devices" list into "Blocked Devices" section.
  - Blacklist badge "BANNED" appears in bold dark-red pill.
  - Success toast: *"Device F4:D4:88:5E:A1:22 permanently blacklisted"*.

### TST-013: Unblock / Remove Device From Blacklist (`DELETE /api/devices/:id/block`)
- **Method & Route:** `DELETE /api/devices/dev_01/block`
- **Frontend Trigger:** In Rules > Blacklist tab, user clicks "Unblock" on banned device.
- **Request Payload:** None
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "dev_01",
    "status": "unblocked",
    "message": "MAC address removed from blacklist"
  }
  ```
- **UI Verification:**
  - Device is removed from Blacklist table.
  - Toast: *"Device unblocked. It may now reconnect to Wi-Fi."*

### TST-014: Pause All Devices ("Dinner Time" Emergency Freeze) (`POST /api/network/pause-all`)
- **Method & Route:** `POST /api/network/pause-all`
- **Frontend Trigger:** User toggles "Pause All Internet" master switch in header.
- **Request Payload:**
  ```json
  {
    "excludeWhitelisted": true
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "action": "pause_all",
    "pausedDevicesCount": 12,
    "exemptDevicesCount": 2
  }
  ```
- **UI Verification:**
  - Header displays vibrant amber banner: *"Global Internet Pause Active (12 devices frozen)"*.
  - Every non-exempt device card simultaneously switches to "PAUSED".
  - Master button text changes to "Resume All Internet".

---

## 4. Bandwidth Throttling & QoS Endpoints

### TST-015: Apply Speed Limit / Throttling (`POST /api/devices/:id/throttle`)
- **Method & Route:** `POST /api/devices/dev_01/throttle`
- **Frontend Trigger:** User opens "Speed Limit" modal, drags slider to `2.5 Mbps` Download and `1.0 Mbps` Upload, clicks "Apply Limit".
- **Request Payload:**
  ```json
  {
    "downloadLimitKbps": 2500,
    "uploadLimitKbps": 1000,
    "priority": "low"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "dev_01",
    "isThrottled": true,
    "downloadLimitKbps": 2500,
    "uploadLimitKbps": 1000,
    "appliedAt": "2026-09-10T00:30:00Z"
  }
  ```
- **UI Verification:**
  - Speed limit modal closes smoothly.
  - Device card displays amber badge: *"Throttled (2.5 Mbps ↓ / 1.0 Mbps ↑)"*.
  - In Drawer, current speed gauge ceiling is adjusted to the 2.5 Mbps threshold line.

### TST-016: Remove Speed Limit (`DELETE /api/devices/:id/throttle`)
- **Method & Route:** `DELETE /api/devices/dev_01/throttle`
- **Frontend Trigger:** User clicks "Remove Limit" in Speed Limit modal or drawer chip.
- **Request Payload:** None
- **Success Response (`200 OK`):**
  ```json
  {
    "id": "dev_01",
    "isThrottled": false,
    "message": "Traffic shaping rules removed"
  }
  ```
- **UI Verification:**
  - Amber "Throttled" badge disappears.
  - Toast: *"Speed limit removed for Alex Work Laptop"*.

---

## 5. Traffic, Visited Domains & Categorization Endpoints

### TST-017: Query Recent Visited Domains Stream (`GET /api/domains/recent`)
- **Method & Route:** `GET /api/domains/recent?limit=50&category=all`
- **Frontend Trigger:** User navigates to "Activity" tab.
- **Request Query Params:** `limit=50&category=all&search=`
- **Success Response (`200 OK`):**
  ```json
  {
    "total": 420,
    "domains": [
      {
        "id": "dom_01",
        "domain": "youtube.com",
        "category": "streaming",
        "deviceId": "dev_01",
        "deviceNickname": "Alex Work Laptop",
        "timestamp": "2026-09-10T00:31:05Z",
        "status": "allowed",
        "queryCountToday": 142,
        "bytesTransferred": 842000000
      },
      {
        "id": "dom_02",
        "domain": "doubleclick.net",
        "category": "ad_tracker",
        "deviceId": "dev_02",
        "deviceNickname": "Kids Tablet",
        "timestamp": "2026-09-10T00:30:58Z",
        "status": "blocked",
        "queryCountToday": 48,
        "bytesTransferred": 0
      }
    ]
  }
  ```
- **UI Verification:**
  - Activity table populates with clean domain rows.
  - `youtube.com` displays Red Streaming badge, YouTube favicon, and "Allowed" status.
  - `doubleclick.net` displays Purple Ad/Tracker badge and red "BLOCKED" pill.

### TST-018: Filter Domain Activity by Category (`GET /api/domains/recent?category=gaming`)
- **Frontend Trigger:** User clicks "Gaming" filter pill in Activity view.
- **Request Query Params:** `category=gaming`
- **Success Response (`200 OK`):** Returns only gaming domains (`roblox.com`, `steamcommunity.com`, `discord.com`).
- **UI Verification:**
  - Table instantly filters to show only gaming rows.
  - Active filter pill displays solid highlight; clear button appears.

### TST-019: Instant Block Domain Directly From Activity Table (`POST /api/domains/block`)
- **Method & Route:** `POST /api/domains/block`
- **Frontend Trigger:** User clicks the quick "Block Domain" button on the `roblox.com` row.
- **Request Payload:**
  ```json
  {
    "domain": "roblox.com",
    "applyToDevices": "all",
    "reason": "parental_control"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "domain": "roblox.com",
    "status": "blocked",
    "blockedAt": "2026-09-10T00:32:00Z"
  }
  ```
- **UI Verification:**
  - Status pill on that row immediately flips from green "Allowed" to red "Blocked".
  - Quick action button switches to "Unblock".
  - Toast: *"roblox.com blocked network-wide"*.

---

## 6. Curfews, Bedtime & Scheduling Endpoints

### TST-020: Create Bedtime Curfew Schedule (`POST /api/schedules`)
- **Method & Route:** `POST /api/schedules`
- **Frontend Trigger:** In Rules > Schedules tab, user fills "Add Bedtime Rule" dialog:
  - Name: `School Night Curfew`
  - Days: Monday - Thursday
  - Start Time: `21:00` (9:00 PM)
  - End Time: `07:00` (7:00 AM)
  - Target Devices: `Kids Tablet`, `Kids Nintendo Switch`
- **Request Payload:**
  ```json
  {
    "name": "School Night Curfew",
    "daysOfWeek": [1, 2, 3, 4],
    "startTime": "21:00",
    "endTime": "07:00",
    "deviceIds": ["dev_02", "dev_05"],
    "action": "pause_wan",
    "enabled": true
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "id": "sched_01",
    "name": "School Night Curfew",
    "daysOfWeek": [1, 2, 3, 4],
    "startTime": "21:00",
    "endTime": "07:00",
    "deviceIds": ["dev_02", "dev_05"],
    "enabled": true,
    "isCurrentlyActive": false
  }
  ```
- **UI Verification:**
  - Dialog closes smoothly.
  - New schedule card appears in the grid with active days highlighted as clean circular chips (M, T, W, Th).
  - Toast: *"Bedtime schedule 'School Night Curfew' created"*.
  - Device cards for `Kids Tablet` now show a Moon icon indicating an assigned bedtime schedule.

### TST-021: Toggle Schedule On/Off (`PATCH /api/schedules/:id`)
- **Method & Route:** `PATCH /api/schedules/sched_01`
- **Frontend Trigger:** User toggles switch on the schedule card.
- **Request Payload:** `{ "enabled": false }`
- **Success Response (`200 OK`):** Updated schedule object with `"enabled": false`.
- **UI Verification:**
  - Schedule card transitions to muted/disabled appearance.
  - Toast: *"Schedule disabled"*.

---

## 7. Mesh Node & Topology Endpoints

### TST-022: Fetch Mesh Nodes & Connected Client Counts (`GET /api/mesh/nodes`)
- **Method & Route:** `GET /api/mesh/nodes`
- **Frontend Trigger:** User views Proximity / Mesh section.
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "nodeId": "node_01",
      "name": "Master Gateway (Office)",
      "isMainRouter": true,
      "ip": "192.168.1.1",
      "connectedClientsCount": 10,
      "backhaul": { "type": "ethernet", "speedMbps": 1000 },
      "channel24": 6,
      "channel5": 149
    },
    {
      "nodeId": "node_02",
      "name": "Living Room Mesh Node",
      "isMainRouter": false,
      "ip": "192.168.1.2",
      "connectedClientsCount": 6,
      "backhaul": { "type": "wireless_5ghz", "signalDbm": -52, "speedMbps": 866 },
      "channel24": 1,
      "channel5": 36
    }
  ]
  ```
- **UI Verification:**
  - Mesh architecture view displays nodes with clean cards and connector lines.
  - Client count pills correctly reflect `10 Devices` and `6 Devices`.
  - Wireless backhaul card displays `-52 dBm` link health pill.

---

## 8. Security, Threat & Alert Endpoints

### TST-023: Fetch Unread Security Alerts (`GET /api/security/alerts`)
- **Method & Route:** `GET /api/security/alerts?unread=true`
- **Frontend Trigger:** On load and polled every 15s.
- **Success Response (`200 OK`):**
  ```json
  [
    {
      "id": "alt_01",
      "type": "new_device_connected",
      "severity": "medium",
      "title": "Unrecognized Device Joined",
      "description": "Unknown device with MAC 7A:91:E2:44:11:90 connected to Living Room Mesh",
      "targetMac": "7A:91:E2:44:11:90",
      "timestamp": "2026-09-10T00:33:00Z",
      "isRead": false
    },
    {
      "id": "alt_02",
      "type": "malicious_domain_blocked",
      "severity": "critical",
      "title": "Phishing Attempt Blocked",
      "description": "Smart TV attempted to resolve 'malware-c2-tracker.biz'. Connection dropped.",
      "targetMac": "AC:12:34:56:78:90",
      "timestamp": "2026-09-10T00:31:20Z",
      "isRead": false
    }
  ]
  ```
- **UI Verification:**
  - Red notification badge with number `2` appears on top-bar bell icon.
  - Opening alert flyout displays both alert cards with proper icons (Warning triangle, Shield check).
  - Quick action button "Block Device" is present on the unknown device alert.

### TST-024: Dismiss / Mark Alert as Read (`PATCH /api/security/alerts/:id`)
- **Method & Route:** `PATCH /api/security/alerts/alt_01`
- **Frontend Trigger:** User clicks "Dismiss" or "Mark as Read" inside the alert flyout.
- **Request Payload:** `{ "isRead": true }`
- **Success Response (`200 OK`):** Returns updated alert object.
- **UI Verification:**
  - Alert smoothly slides out or fades to read state.
  - Bell badge counter decrements from `2` to `1`.

---

## 9. Real-Time WebSocket Telemetry & UI Synchronization

### TST-025: WebSocket Connection Handshake & Authentication (`ws://.../ws/telemetry`)
- **Protocol:** `WSS / WS`
- **Payload Sent on Connect:** `{ "action": "subscribe", "token": "jwt_or_session_key" }`
- **Expected Initial Server Message:**
  ```json
  {
    "type": "connection_ack",
    "timestamp": 1788914000,
    "heartbeatIntervalMs": 5000
  }
  ```
- **UI Verification:**
  - Header connection indicator shows connected state. Zero reconnection banners displayed.

### TST-026: Live Speed Telemetry Tick (`telemetry_speed_tick`)
- **WebSocket Broadcast Message (every 1000ms):**
  ```json
  {
    "type": "speed_tick",
    "timestamp": 1788914001,
    "wanDownloadBps": 52400000,
    "wanUploadBps": 9100000,
    "deviceSpeeds": {
      "dev_01": { "downBps": 48200000, "upBps": 8200000 },
      "dev_02": { "downBps": 120000, "upBps": 45000 }
    }
  }
  ```
- **UI Verification:**
  - Header Wan Download and Upload counters update without page repaint or layout jump.
  - Device card for `dev_01` updates live speed pill to `48.2 MB/s ↓`.
  - Active device details drawer speed graph appends new data point smoothly.

### TST-027: New Device Joined Broadcast Event (`event_device_joined`)
- **WebSocket Server Broadcast:**
  ```json
  {
    "type": "device_joined",
    "device": {
      "id": "dev_99",
      "mac": "2C:F0:EE:11:22:33",
      "ip": "192.168.1.144",
      "hostname": "Unknown-Device",
      "vendor": "Espressif Inc.",
      "category": "iot",
      "status": "active",
      "signalDbm": -55,
      "isNew": true
    }
  }
  ```
- **UI Verification:**
  - Active device count pill increments by 1.
  - New device card smoothly prepends to the top of the grid with an animated entry and pulsing green "NEW" badge.
  - System toast chimes: *"New device detected: Unknown-Device (Espressif Inc.)"*.

### TST-028: WebSocket Disconnect & Exponential Backoff Reconnection
- **Trigger:** Kill backend process or disconnect network cable.
- **UI Verification:**
  - Status dot in header switches to pulsing yellow: *"Reconnecting to Sentinel..."*.
  - UI displays subtle overlay banner with countdown: *"Connection lost. Retrying in 2s..."*.
  - Restart backend server; verify client auto-reconnects, refreshes inventory, and dismisses the banner cleanly without needing a manual browser page refresh.

---

## 10. Theme Switching & UI Consistency Test Suite

### TST-029: Palette Switch Verification (Clean Slate -> Warm Neutral -> Nordic Sky -> Emerald Minimal -> Onyx Contrast)
- **Frontend Trigger:** User opens Theme Picker in header, clicks each palette swatch sequentially.
- **Verification Criteria:**
  - Verify `data-theme` attribute on `<html data-theme="...">` updates to `clean-slate`, `warm-neutral`, `nordic-sky`, `emerald-minimal`, and `onyx-contrast`.
  - Verify every component (Buttons, Modals, Popovers, Badges, Tables, Sliders, Cards) inherits the updated `--primary`, `--bg-app`, and `--border-subtle` custom properties instantly.
  - Verify zero contrast violations or unreadable text on any element.
  - Reload browser page (`F5`); verify selected palette persists from `localStorage`.
