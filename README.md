<p align="center">
  <img src="https://img.shields.io/badge/Wi--Fi-Sentinel-0ea5e9?style=for-the-badge&logo=wifi&logoColor=white" alt="WiFi Sentinel" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47a248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger" />
</p>

<h1 align="center">📡 Wi-Fi Sentinel</h1>

<p align="center">
  <strong>Enterprise-grade Wi-Fi device monitoring & network control system</strong><br/>
  Real-time device discovery · Live bandwidth telemetry · Device management · Network security
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-getting-started">Setup</a> •
  <a href="#-api-reference--interactive-swagger-ui">Swagger API</a> •
  <a href="docs/SWAGGER_AND_API_REFERENCE.md">Full API Docs</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-license">License</a>
</p>

---

## ✨ Features

### 🔍 Real-Time Device Discovery
- **Live subnet scanning** — ARP-based discovery across the entire `/24` subnet
- **Automatic device identification** — MAC vendor lookup via IEEE OUI database
- **Randomized MAC detection** — Identifies iOS 14+ and Android 10+ privacy addresses
- **Auto-refresh** — Background scanning every 20 seconds with WebSocket push updates

### 📊 Live Bandwidth Telemetry
- **1-second resolution** — Real-time download/upload speed from hardware `netstat` counters
- **Per-device tracking** — Individual bandwidth consumption for every connected device
- **WebSocket streaming** — Sub-second speed ticks pushed to the dashboard via `ws`

### 🎛️ Device Management
- **Pause / Resume** — Temporarily suspend internet access for any device
- **Block / Unblock** — Permanently block rogue or unwanted devices
- **Kick (Deauthenticate)** — Force-disconnect a device from the network
- **Throttle** — Set custom download/upload speed limits per device
- **Rename / Categorize** — Assign nicknames and categories (phone, laptop, TV, IoT, etc.)

### 🛡️ Network Security
- **New device alerts** — Instant detection of unknown devices joining the network
- **Security threat scanning** — Identifies potential vulnerabilities and rogue access points
- **DNS activity monitoring** — Tracks real DNS queries from the Windows DNS cache
- **Domain categorization** — Auto-classifies domains (work, streaming, social, ad/tracker)

### 🕐 Scheduling & Rules
- **Bedtime schedules** — Auto-pause devices on a daily schedule
- **Content filtering rules** — Block categories of traffic network-wide
- **Custom rules engine** — Create time-based or device-based access policies

### 🎨 Premium UI
- **6 color themes** — Zinc, Slate, Blue, Violet, Emerald, Rose
- **Light/Dark mode** — System-aware with manual toggle
- **Responsive layout** — Works on desktop and tablet
- **Glassmorphism design** — Modern frosted-glass aesthetic with smooth animations
- **Component library** — 15+ custom UI components built on Radix UI primitives

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks & context |
| **TypeScript 5.7** | Type-safe development |
| **Vite 6** | Lightning-fast dev server & bundler |
| **Tailwind CSS 3.4** | Utility-first styling |
| **Radix UI** | Accessible headless components (Dialog, Tooltip, Select, etc.) |
| **Lucide React** | Beautiful icon library |
| **class-variance-authority** | Component variant management |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 4** | REST API server |
| **TypeScript 5.7** | Type-safe server code |
| **MongoDB Atlas + Mongoose 8** | Cloud database with ODM |
| **WebSocket (ws)** | Real-time telemetry streaming |
| **Nodemon + tsx** | Hot-reload development server |

### System Integration (Windows)
| Command | Data Extracted |
|---|---|
| `netsh wlan show interfaces` | SSID, BSSID, band, channel, signal%, radio type, link speeds |
| `arp -a` | All connected devices (IP + MAC address) |
| `netstat -e` | Real-time byte counters for bandwidth calculation |
| `ipconfig /displaydns` | Live DNS query cache |
| `nslookup <ip>` | Real device hostnames from router DNS |

---

## 📁 Project Structure

```
wifi-manager/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Shared components
│   │   │   │   └── ThemePicker.tsx   # 6-theme color palette switcher
│   │   │   ├── layout/              # App shell, sidebar, header
│   │   │   │   └── AppShell.tsx
│   │   │   ├── ui/                  # Reusable UI primitives
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Dialog.tsx
│   │   │   │   ├── Drawer.tsx
│   │   │   │   ├── DropdownMenu.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Popover.tsx
│   │   │   │   ├── RssiIndicator.tsx
│   │   │   │   ├── Slider.tsx
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── Switch.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── Tooltip.tsx
│   │   │   └── views/               # Page-level views
│   │   │       ├── OverviewView.tsx       # Dashboard home
│   │   │       ├── DevicesView.tsx        # Device grid + table
│   │   │       ├── DeviceDetailDrawer.tsx # Slide-over device inspector
│   │   │       ├── ActivityView.tsx       # DNS & traffic log
│   │   │       ├── RulesView.tsx          # Schedules & filters
│   │   │       ├── SecurityView.tsx       # Threat scanner
│   │   │       ├── SettingsView.tsx       # App preferences
│   │   │       ├── ThrottleModal.tsx      # Speed limiter dialog
│   │   │       └── KickConfirmModal.tsx   # Device removal confirm
│   │   ├── context/                 # React context providers
│   │   │   ├── DeviceContext.tsx     # Device state + API integration
│   │   │   ├── ThemeContext.tsx      # Theme + dark mode
│   │   │   └── WebSocketContext.tsx  # Real-time WS connection
│   │   ├── lib/                     # Utility functions
│   │   ├── styles/                  # Global CSS + Tailwind config
│   │   └── types/                   # TypeScript type definitions
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MongoDB Atlas connection
│   │   ├── controllers/
│   │   │   ├── device.controller.ts     # CRUD + actions (pause/block/kick/throttle)
│   │   │   ├── traffic.controller.ts    # DNS activity & domain logs
│   │   │   ├── schedule.controller.ts   # Bedtime & rule schedules
│   │   │   ├── security.controller.ts   # Threat scanning
│   │   │   └── system.controller.ts     # WiFi interface & mesh info
│   │   ├── models/
│   │   │   ├── Device.model.ts      # Device schema (MAC, IP, vendor, status, etc.)
│   │   │   ├── Alert.model.ts       # Security alert schema
│   │   │   ├── DomainLog.model.ts   # DNS query log schema
│   │   │   ├── MeshNode.model.ts    # Mesh/AP node schema
│   │   │   └── Schedule.model.ts    # Bedtime schedule schema
│   │   ├── routes/
│   │   │   ├── index.ts             # Route aggregator
│   │   │   ├── device.routes.ts     # /api/devices/*
│   │   │   ├── traffic.routes.ts    # /api/domains/*
│   │   │   ├── schedule.routes.ts   # /api/schedules/*
│   │   │   ├── security.routes.ts   # /api/security/*
│   │   │   └── system.routes.ts     # /api/system/*
│   │   ├── services/
│   │   │   ├── realNetwork.service.ts   # Core: ARP scan, WiFi info, OUI lookup, bandwidth
│   │   │   ├── device.service.ts        # Device CRUD + memory store
│   │   │   ├── telemetry.service.ts     # 1s speed ticks + 20s auto-scanner
│   │   │   ├── traffic.service.ts       # DNS cache capture & domain tracking
│   │   │   ├── schedule.service.ts      # Schedule management
│   │   │   └── security.service.ts      # Threat detection
│   │   ├── websocket/
│   │   │   └── telemetryServer.ts   # WebSocket server for real-time push
│   │   ├── middlewares/
│   │   ├── app.ts                   # Express app configuration
│   │   └── server.ts               # Server entry point
│   ├── tests/                       # API test suite
│   ├── .env.example                 # Environment template
│   ├── nodemon.json
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
├── .env.example
├── package.json                     # Root workspace scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB Atlas** account (free tier works)
- **Windows 10/11** (uses Windows-specific network commands)

### 1. Clone the Repository

```bash
git clone https://github.com/zayndotdev/wifi-manager.git
cd wifi-manager
```

### 2. Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Configure Environment

Create the environment file for the server:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your MongoDB Atlas connection string:

```env
PORT=5080
HOST=0.0.0.0
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/wifi_sentinel?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:5188
SIMULATE_GATEWAY=true
```

Also create a root `.env` with the same MongoDB URI:

```env
PORT=5080
HOST=0.0.0.0
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/wifi_sentinel?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:5188
SIMULATE_GATEWAY=true
```

### 4. Run the Application

From the project root, run both server and client simultaneously:

```bash
npm run dev
```

This starts:
- **Backend** → `http://localhost:5080` (Express API + WebSocket on port 5001)
- **Frontend** → `http://localhost:5188` (Vite dev server)

Open your browser to `http://localhost:5188` to access the dashboard.

### 5. Run Tests

```bash
npm test
```

---

## 🔌 API Reference & Interactive Swagger UI

Wi-Fi Sentinel includes an interactive **Swagger UI** for testing endpoints directly in your browser, alongside an **OpenAPI 3.0.3 specification** for importing into tools like Postman or Insomnia.

- 📖 **Interactive Swagger UI:** [`http://localhost:5080/api-docs`](http://localhost:5080/api-docs)
- 📄 **OpenAPI 3.0.3 JSON Spec:** [`http://localhost:5080/api-docs/swagger.json`](http://localhost:5080/api-docs/swagger.json) or [`docs/openapi.json`](docs/openapi.json)
- 📚 **Comprehensive API Guide:** See the complete, exhaustive documentation in [**`docs/SWAGGER_AND_API_REFERENCE.md`**](docs/SWAGGER_AND_API_REFERENCE.md)

### Core Endpoints

#### Devices (`/api/devices`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/devices` | List all discovered devices |
| `GET` | `/api/devices/:id` | Get device by ID (hardware & telemetry) |
| `PATCH` | `/api/devices/:id` | Update device nickname or category |
| `POST` | `/api/devices/scan` | Trigger immediate ARP subnet re-scan |
| `POST` | `/api/devices/:id/pause` | Pause WAN internet access for device |
| `POST` | `/api/devices/:id/resume` | Resume WAN internet access for device |
| `POST` | `/api/devices/:id/kick` | Deauthenticate / force-disconnect device |
| `POST` | `/api/devices/:id/block` | Permanently blacklist device by MAC |
| `DELETE` | `/api/devices/:id/block` | Unblock / remove MAC from blacklist |
| `POST` | `/api/devices/:id/throttle` | Apply QoS bandwidth rate-limiting |
| `DELETE` | `/api/devices/:id/throttle` | Remove bandwidth rate-limiting |

#### Network Controls (`/api/network` & `/api/devices`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/network/pause-all` | Emergency pause: cut WAN for all devices |
| `POST` | `/api/network/resume-all` | Resume WAN for all devices |

#### Traffic & Parental Controls (`/api/domains`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/domains/recent` | Get recent DNS activity log (supports `?category=`) |
| `POST` | `/api/domains/block` | Blacklist a domain name network-wide |
| `DELETE` | `/api/domains/block` | Unblock a domain name |

#### Bedtime & Focus Schedules (`/api/schedules`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/schedules` | List all access control schedules |
| `POST` | `/api/schedules` | Create new schedule rule |
| `PATCH` | `/api/schedules/:id` | Toggle schedule enabled/disabled |
| `DELETE` | `/api/schedules/:id` | Delete schedule rule |

#### Security Threat Alerts (`/api/security`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/security/alerts` | List threat & rogue device alerts |
| `PATCH` | `/api/security/alerts/:id` | Mark alert as acknowledged / read |

#### System & Mesh (`/api/system` & `/api/mesh`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Gateway engine health check & timestamp |
| `GET` | `/api/system/status` | Real gateway telemetry (WAN/LAN IP, SSID, BSSID, CPU, RAM) |
| `GET` | `/api/system/nodes` | Get Wi-Fi mesh access points & radio backhaul |
| `GET` | `/api/mesh/nodes` | Mesh nodes alias endpoint |

### ⚡ WebSocket Telemetry Protocol

Connect to `ws://localhost:5080/ws/telemetry` for live hardware metrics:

| Event | Payload Summary | Frequency |
|---|---|---|
| `connection_ack` | Handshake acknowledgment and status | Immediate on connect |
| `speed_tick` | Real WAN download/upload speeds & per-device rates | Every 1 second |
| `devices_updated` | Discovered device list updates from ARP | Every 20 seconds |
| `alert` | Threat notifications & rogue device warnings | Event-driven |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (React 19)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Overview  │ │ Devices  │ │ Activity │ │  Security  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       │             │            │              │        │
│  ┌────┴─────────────┴────────────┴──────────────┴────┐  │
│  │           DeviceContext + WebSocketContext          │  │
│  └────────────────────┬──────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        │
          HTTP REST     │    WebSocket (ws)
          :5080/api/*   │    :5001
                        │
┌───────────────────────┼─────────────────────────────────┐
│               EXPRESS SERVER (Node.js)                    │
│  ┌────────────────────┴──────────────────────────────┐  │
│  │                  Route Layer                        │  │
│  │   /devices  /domains  /system  /security  /sched   │  │
│  └────────────────────┬──────────────────────────────┘  │
│  ┌────────────────────┴──────────────────────────────┐  │
│  │               Controller Layer                      │  │
│  └────────────────────┬──────────────────────────────┘  │
│  ┌────────────────────┴──────────────────────────────┐  │
│  │                Service Layer                        │  │
│  │  ┌──────────────┐ ┌───────────┐ ┌──────────────┐  │  │
│  │  │  realNetwork  │ │ telemetry │ │   traffic     │  │  │
│  │  │  .service     │ │ .service  │ │   .service    │  │  │
│  │  └──────┬───────┘ └─────┬─────┘ └──────┬───────┘  │  │
│  └─────────┼───────────────┼───────────────┼──────────┘  │
│            │               │               │             │
│  ┌─────────┴───────────────┴───────────────┴──────────┐  │
│  │              Windows System Commands                │  │
│  │   netsh wlan · arp -a · netstat -e · ipconfig /dns  │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                               │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │              MongoDB Atlas (Mongoose)               │  │
│  │   Devices · Alerts · DomainLogs · MeshNodes         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Discovery** — `realNetwork.service` sends UDP pings to all 254 IPs, reads the ARP cache, and resolves vendors via OUI prefix
2. **Persistence** — Discovered devices are upserted into MongoDB Atlas with full metadata
3. **Telemetry** — Every 1 second, `netstat -e` byte counters are polled and delta-calculated for real-time bandwidth
4. **Push** — WebSocket broadcasts `speed_tick` and `devices_updated` events to all connected clients
5. **Rendering** — React `DeviceContext` merges REST snapshots with WebSocket deltas for instant UI updates

---

## 🎨 Theme System

Wi-Fi Sentinel ships with 6 curated color palettes and full light/dark mode support:

| Theme | Primary Color | Best For |
|---|---|---|
| **Zinc** | `#71717a` | Clean, professional |
| **Slate** | `#64748b` | Neutral, enterprise |
| **Blue** | `#3b82f6` | Classic tech |
| **Violet** | `#8b5cf6` | Modern, creative |
| **Emerald** | `#10b981` | Network / green theme |
| **Rose** | `#f43f5e` | Bold, attention-grabbing |

Themes are applied via CSS custom properties and persist in `localStorage`.

---

## 📋 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5080` | Express server port |
| `HOST` | No | `0.0.0.0` | Server bind address |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas connection string |
| `CORS_ORIGIN` | No | `http://localhost:5188` | Allowed CORS origin |
| `SIMULATE_GATEWAY` | No | `true` | Enable gateway simulation |

---

## 🧪 Testing

The project includes an automated test suite that validates all API endpoints against the live MongoDB database:

```bash
# Run the full test suite
npm test

# Or run directly from the server directory
cd server && npm test
```

Tests cover:
- Device CRUD operations
- Network scan functionality
- Device actions (pause, resume, block, kick, throttle)
- System health and WiFi info endpoints
- Traffic and DNS activity endpoints

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👤 Author

**Zayn** — [@zayndotdev](https://github.com/zayndotdev)

---

<p align="center">
  Built with ❤️ using React, Node.js, and real hardware telemetry
</p>
