# Wi-Fi Sentinel — Complete Master Project Implementation Tasks

> **Design Directive & Visual Foundation:**
> - **Aesthetics & Tone:** Clean, lightweight, airy, modern SaaS design inspired by `sale.theengine.dev`.
> - **Typography:** Simple, crisp `Inter` font. Strict typography hierarchy without decorative text overload or visual noise.
> - **Content Density:** Concise, high-signal data presentation. Clean metric badges, visual progress indicators, and compact cards rather than walls of text.
> - **Theme Architecture:** Multi-palette light theme engine powered by CSS Custom Properties (`--primary`, `--secondary`, `--tertiary`, `--bg-app`, `--bg-card`, `--border-subtle`, `--text-primary`, `--text-muted`, etc.) allowing live user switching.
> - **Component Toolkit:** Headless/accessible atomic components (Dialogs, Popovers, Tooltips, Segmented Controls, Action Buttons, Sliders, Badges, Data Tables).

---

## Task Summary Dashboard
- **Total Tasks:** 215 Tasks
- **Phases:** 10 Structured Phases (0 through 9)
- **Status:** Pending Execution (0/215 Completed)

---

## Phase 0: Workspace, Build Tooling & Environment Initialization (Tasks 001 - 018)

- [ ] **TASK-001**: Initialize web project root structure (`package.json`, `vite.config.ts`, `tsconfig.json`) using Vite + React + TypeScript.
- [ ] **TASK-002**: Install and configure Tailwind CSS (v3 or v4 engine) with PostCSS and Autoprefixer.
- [ ] **TASK-003**: Configure path aliases in `vite.config.ts` and `tsconfig.json` (`@/components`, `@/lib`, `@/styles`, `@/types`, `@/hooks`, `@/services`).
- [ ] **TASK-004**: Import Google Font `Inter` (`wght@300;400;500;600;700`) via `<link>` in `index.html` with `font-display: swap`.
- [ ] **TASK-005**: Set up `tailwind.config.js` to extend default fonts with `fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }`.
- [ ] **TASK-006**: Configure Lucide React (`lucide-react`) icon pack for clean, minimalist SVG iconography.
- [ ] **TASK-007**: Set up ESLint and Prettier configurations with strict rules for React Hooks and clean imports.
- [ ] **TASK-008**: Create project directory layout: `/src/components/ui`, `/src/components/features`, `/src/styles`, `/src/context`, `/src/types`, `/src/mocks`.
- [ ] **TASK-009**: Configure global TypeScript interfaces for Network Devices, AP Nodes, Domain Events, Traffic Stats, and Security Alerts in `/src/types/network.ts`.
- [ ] **TASK-010**: Create theme types interface in `/src/types/theme.ts` supporting multiple palette configurations.
- [ ] **TASK-011**: Set up local development proxy configuration in `vite.config.ts` to seamlessly route `/api` and `/ws` to the backend server.
- [ ] **TASK-012**: Create `.env.example` and `.env.development` with variables for `VITE_API_URL`, `VITE_WS_URL`, and `VITE_USE_MOCK_BACKEND`.
- [ ] **TASK-013**: Set up Git ignore file (`.gitignore`) ignoring `node_modules`, `dist`, local environment files, and build caches.
- [ ] **TASK-014**: Create `/src/lib/utils.ts` with class merging utility (`clsx` + `tailwind-merge` as `cn(...)`).
- [ ] **TASK-015**: Set up `/src/lib/formatters.ts` for byte formatting (KB/s, MB/s, GB), timestamps, MAC address masks, and RSSI dBm descriptions.
- [ ] **TASK-016**: Create base index HTML file with clean viewport settings, Apple mobile web app capabilities, and dynamic title tag.
- [ ] **TASK-017**: Set up favicon asset with a sleek, minimalist geometric Wi-Fi pulse emblem.
- [ ] **TASK-018**: Verify dev server cold start (`npm run dev`) and validate zero console errors or warnings.

---

## Phase 1: CSS Architecture, Tokens & Dynamic Palette Engine (Tasks 019 - 040)

- [ ] **TASK-019**: Create `/src/styles/tokens.css` defining base CSS custom properties for spacing, border-radius, shadows, and z-indexes.
- [ ] **TASK-020**: Define standard semantic color variables in `:root`: `--primary`, `--primary-hover`, `--primary-foreground`.
- [ ] **TASK-021**: Define secondary color variables: `--secondary`, `--secondary-hover`, `--secondary-foreground`.
- [ ] **TASK-022**: Define tertiary and accent color variables: `--tertiary`, `--accent`, `--accent-hover`, `--accent-foreground`.
- [ ] **TASK-023**: Define background color hierarchy: `--bg-app`, `--bg-card`, `--bg-card-subtle`, `--bg-surface`, `--bg-glass`.
- [ ] **TASK-024**: Define border and divider color variables: `--border-subtle`, `--border-default`, `--border-hover`, `--border-active`.
- [ ] **TASK-025**: Define typography color variables: `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-invert`.
- [ ] **TASK-026**: Define status and signal color variables: `--status-online`, `--status-warning`, `--status-blocked`, `--status-throttled`, `--status-unknown`.
- [ ] **TASK-027**: Create Palette 1: **"Clean Slate"** (Default - crisp off-white background `#FBFBFB`, pure white cards `#FFFFFF`, deep graphite text `#121316`, soft cool-gray borders `#E8EAED`, electric sapphire primary `#2563EB`).
- [ ] **TASK-028**: Create Palette 2: **"Warm Neutral"** (Alabaster background `#F7F5F2`, warm white cards `#FFFFFF`, deep espresso text `#1C1917`, stone borders `#E7E4DF`, warm terracotta/amber primary `#EA580C`).
- [ ] **TASK-029**: Create Palette 3: **"Nordic Sky"** (Cool ice background `#F3F7FA`, pure white cards `#FFFFFF`, deep navy text `#0F172A`, frost borders `#DFE6ED`, arctic azure primary `#0284C7`).
- [ ] **TASK-030**: Create Palette 4: **"Emerald Minimal"** (Soft botanical background `#F4F8F5`, card `#FFFFFF`, forest text `#062E1A`, sage borders `#DEE8E0`, vibrant mint/emerald primary `#059669`).
- [ ] **TASK-031**: Create Palette 5: **"Onyx Contrast"** (Ultra-clean subtle dark mode for night monitoring: `#0A0A0C` background, `#141418` cards, `#24242C` borders, `#F3F4F6` text).
- [ ] **TASK-032**: Implement `data-theme` attribute selector logic in `tokens.css` mapping each palette smoothly without layout shifts.
- [ ] **TASK-033**: Set up `/src/context/ThemeContext.tsx` with persistent `localStorage` saving and system preference detection.
- [ ] **TASK-034**: Add smooth CSS transitions (`transition: background-color 0.2s ease, border-color 0.2s ease`) to tokens while excluding layout properties.
- [ ] **TASK-035**: Build a sleek, compact Theme Selector component with palette previews (dot preview + name).
- [ ] **TASK-036**: Map all custom CSS variables into `tailwind.config.js` (`colors.primary = var(--primary)`, etc.) to enable seamless utility classes.
- [ ] **TASK-037**: Establish typography scale in CSS: text sizes (`text-xs: 0.75rem`, `text-sm: 0.875rem`, `text-base: 1rem`, `text-lg: 1.125rem`, `text-xl: 1.25rem`, `text-2xl: 1.5rem`).
- [ ] **TASK-038**: Set letter-spacing defaults in `index.css` for `Inter` (`-0.015em` for headers, `-0.01em` for body, `+0.02em` for all-caps pills).
- [ ] **TASK-039**: Create custom scrollbar styling utility: thin, unobtrusive, matching current palette borders.
- [ ] **TASK-040**: Write automated unit tests for ThemeContext ensuring theme switching dispatches correct CSS attributes to `document.documentElement`.

---

## Phase 2: Design System & Shared Atomic UI Components (Tasks 041 - 075)

- [ ] **TASK-041**: Build **Button** component with variants: `primary`, `secondary`, `tertiary`, `outline`, `ghost`, `destructive`, `subtle`.
- [ ] **TASK-042**: Add Button size options: `xs` (24px), `sm` (32px), `md` (38px), `lg` (44px), and `icon` (square).
- [ ] **TASK-043**: Add Button loading state with an ultra-fine minimalist spinner and disabled state interactions.
- [ ] **TASK-044**: Build **Badge / Pill** component for status tags (Online, Paused, Throttled, Mesh Node, 5GHz/2.4GHz, New Device).
- [ ] **TASK-045**: Add Badge variants with subtle transparent background and tinted solid borders (e.g. `bg-emerald-500/10 text-emerald-700 border-emerald-500/20`).
- [ ] **TASK-046**: Build **Tooltip** component with zero-delay trigger option, keyboard focus accessibility, and smart screen-edge flipping.
- [ ] **TASK-047**: Style Tooltip with subtle shadow (`shadow-md`), backdrop blur, 11px font size, and light border.
- [ ] **TASK-048**: Build **Modal Dialog** component with overlay backdrop blur, escape key exit, and focus trapping.
- [ ] **TASK-049**: Create animated entry and exit transitions for Modal Dialog (scale `0.98 -> 1.0`, opacity `0 -> 1`).
- [ ] **TASK-050**: Build **Confirm Dialog** preset for high-impact actions (Kick Device, Block MAC, Flush DNS cache).
- [ ] **TASK-051**: Build **Popover / Dropdown Menu** component with item grouping, keyboard arrow navigation, and active state highlight.
- [ ] **TASK-052**: Build **Segmented Control / Tab Switcher** (pill-style sliding indicator with spring-like CSS ease).
- [ ] **TASK-053**: Build **Switch / Toggle** component for instant 1-tap settings (Internet Pause, Blocklist toggle, SafeSearch).
- [ ] **TASK-054**: Add haptic micro-transition and color shift to Switch component on toggle.
- [ ] **TASK-055**: Build **Slider** component for speed limiters / bandwidth throttling (500 KB/s to 1 Gbps) with live value tooltip.
- [ ] **TASK-056**: Build **Input** field component (clean border, subtle focus ring `--ring`, optional prefix icon and clear button).
- [ ] **TASK-057**: Build **Search Input** with embedded shortcut indicator (`⌘K` / `Ctrl+K`) and instant debounce hook.
- [ ] **TASK-058**: Build **Select / Dropdown** component with clean custom chevron and native fallback on mobile touch devices.
- [ ] **TASK-059**: Build **Card** container component with standard padding, subtle border, and optional interactive hover elevation.
- [ ] **TASK-060**: Build **Stat Card** component with compact metric number, micro sparkline or mini progress bar, and concise comparison label.
- [ ] **TASK-061**: Build **Toast Notification** system with variants (`success`, `warning`, `error`, `info`, `alert`).
- [ ] **TASK-062**: Implement auto-dismissing queue for Toasts with manual swipe/close and action buttons (e.g. "Undo Pause").
- [ ] **TASK-063**: Build **Skeleton Loader** primitives for cards, table rows, and metric stats to prevent layout shift during loading.
- [ ] **TASK-064**: Build **Empty State** component with clean vector illustration, concise headline, and single action button.
- [ ] **TASK-065**: Build **Data Table** wrapper with clean column headers, sort indicators, compact row padding, and sticky header support.
- [ ] **TASK-066**: Build **Pagination / Cursor Bar** for log tables with page size selector and quick page navigation.
- [ ] **TASK-067**: Build **Signal Strength Indicator (RSSI Meter)**: 4-bar minimalist Wi-Fi icon dynamically tinted by dBm level.
- [ ] **TASK-068**: Build **Device Hardware Icon** resolver mapping OUI/category to sleek icons (Phone, Laptop, TV, Game Console, IoT, Router).
- [ ] **TASK-069**: Build **Drawer / Slide-over Panel** for in-depth Device Profile inspection without leaving the active view.
- [ ] **TASK-070**: Build **Circular Progress Ring** for bandwidth quota consumption (Daily / Weekly).
- [ ] **TASK-071**: Build **Badge Counter** component with subtle pulse animation for new alerts.
- [ ] **TASK-072**: Build **Kbd** keyboard shortcut component (`⌘`, `⇧`, `Esc`, `↵`) for power-user navigation.
- [ ] **TASK-073**: Write comprehensive Storybook/Component Preview page to review all UI components side-by-side across all 5 themes.
- [ ] **TASK-074**: Audit all UI components for WCAG AA color contrast ratios across light and dark palettes.
- [ ] **TASK-075**: Verify zero text overflow or broken flexbox wraps on narrow mobile displays (375px) and ultra-wide screens (1920px).

---

## Phase 3: Application Shell, Header & Global Navigation (Tasks 076 - 090)

- [ ] **TASK-076**: Construct **AppShell** layout with clean top navigation bar, main container, and responsive layout constraints.
- [ ] **TASK-077**: Implement **Top Navigation Bar** with logo brand mark, live network status pill, quick search, theme picker, and alert bell.
- [ ] **TASK-078**: Build **Live Network Status Indicator** (Green glowing dot: "All Systems Operational" / Yellow: "High Latency" / Red: "Gateway Offline").
- [ ] **TASK-079**: Build **Global Quick Search (`⌘K`) Dialog** allowing instant jumping to any device, visited domain, or setting.
- [ ] **TASK-080**: Build **Main Navigation Tab Bar** with concise labels:
  - `Overview` (Dashboard summary & live speeds)
  - `Devices` (Inventory, signal, and controls)
  - `Activity` (Domain history, search trends, bandwidth)
  - `Rules` (Bedtime curfews, throttling, blacklists)
  - `Security` (Intrusion alerts, new devices, DNS blocks)
  - `Settings` (AP configuration, theme, gateway options)
- [ ] **TASK-081**: Add active tab indicator with subtle underline and smooth spring transition.
- [ ] **TASK-082**: Implement responsive mobile drawer navigation menu triggered by a sleek hamburger icon on mobile viewports.
- [ ] **TASK-083**: Build **Live Speed Ticker** in top bar showing current WAN Download and Upload speed in real-time.
- [ ] **TASK-084**: Build **Active Device Pill Counter** in header (`18 Connected • 4 Idle`).
- [ ] **TASK-085**: Implement notification drop-down flyout connected to the alert bell icon showing recent network events.
- [ ] **TASK-086**: Add "Mark All as Read" and quick-filter by severity (Critical, Warning, Info) inside the alert flyout.
- [ ] **TASK-087**: Implement client-side routing structure using lightweight router or tab-based hash navigation.
- [ ] **TASK-088**: Set up document title updater reflecting the active page and live client count (`(18) Wi-Fi Sentinel — Devices`).
- [ ] **TASK-089**: Implement sticky top bar with subtle blur backdrop (`backdrop-blur-md bg-app/80 border-b border-subtle`).
- [ ] **TASK-090**: Verify layout responsiveness across desktop (1440px), laptop (1024px), tablet (768px), and mobile (375px).

---

## Phase 4: Connected Client Discovery & Inventory Module (Tasks 091 - 115)

- [ ] **TASK-091**: Create client data store (`/src/context/DeviceContext.tsx`) managing active, offline, and paused devices.
- [ ] **TASK-092**: Build **Device List Header Bar** with total count, search bar, active filter pills (All, Active, Paused, Blocked, IoT).
- [ ] **TASK-093**: Implement view toggle: **Grid Card View** vs. **Compact Table View**.
- [ ] **TASK-094**: Build **Device Grid Card** component featuring:
  - Hardware vendor icon (Apple, Samsung, Sony, etc.)
  - Device Hostname with inline editable nickname
  - Vendor name & detected OS/category badge
  - IP Address and physical MAC Address
  - Real-time RSSI signal indicator & dBm badge
  - Live upload/download rate
  - 1-Click "Pause Internet" toggle button
  - Quick action menu (Kick, Throttle, Details)
- [ ] **TASK-095**: Build **Device Table View** component with sortable columns: Device, IP/MAC, RSSI, Current Speed, Today's Data, Status, Actions.
- [ ] **TASK-096**: Implement **Inline Nickname Editing**: clicking device name transforms into a clean input field; saves on Enter or blur.
- [ ] **TASK-097**: Implement **Vendor OUI Lookup Engine** (mapping first 6 MAC octets to manufacturer name and logo).
- [ ] **TASK-098**: Add device type categorization tagger (Phone, Laptop, Tablet, Smart TV, Audio, Gaming Console, Smart Home/IoT, Unknown).
- [ ] **TASK-099**: Implement **New Device Highlighting**: devices joined in the last 15 minutes display a subtle "NEW" pulse badge.
- [ ] **TASK-100**: Implement **Device Search & Filtering**: filter by hostname, nickname, IP address, MAC address, or vendor in <10ms.
- [ ] **TASK-101**: Build **Offline Devices Drawer / Collapsible Section** separating currently inactive devices from live active devices.
- [ ] **TASK-102**: Add "Forget / Remove Device" action for stale offline devices to prune historical records.
- [ ] **TASK-103**: Implement device connection duration counter ("Connected for 3h 42m" or "Last seen 12m ago").
- [ ] **TASK-104**: Build **Device Details Drawer** (opens on row/card click) displaying deep device telemetry.
- [ ] **TASK-105**: In Details Drawer, show IPv4, IPv6, MAC, Assigned DHCP Lease Expiry, Wi-Fi Band (2.4GHz / 5GHz / 6GHz), Channel, and TX/RX Link Speed.
- [ ] **TASK-106**: In Details Drawer, add live speed graph (charting last 60 seconds of traffic).
- [ ] **TASK-107**: In Details Drawer, add quick toggles for Internet Access, SafeSearch Force, and Category Blocks.
- [ ] **TASK-108**: In Details Drawer, add Bedtime Schedule selector with visual time chips.
- [ ] **TASK-109**: In Details Drawer, show recent domain query history specific to this device.
- [ ] **TASK-110**: In Details Drawer, show presence timeline (joined at, departed at, session duration).
- [ ] **TASK-111**: Implement bulk device actions (e.g. "Pause All Guest Devices", "Resume All").
- [ ] **TASK-112**: Add visual warning badge for devices with randomized/private MAC addresses detected (iOS Private Wi-Fi address indicator).
- [ ] **TASK-113**: Add empty state for device search when zero devices match query with single-click "Clear filters" button.
- [ ] **TASK-114**: Write unit tests for device filtering, sorting (by speed, by name, by signal, by data used), and status tagging.
- [ ] **TASK-115**: Verify smooth UI animations when a device transitions from active to paused or offline.

---

## Phase 5: Proximity Estimation & Mesh Node Location Module (Tasks 116 - 130)

- [ ] **TASK-116**: Build **Proximity Estimator Service** calculating approximate distance based on RSSI dBm and frequency band path loss.
- [ ] **TASK-117**: Design proximity visual badges:
  - `Near (< -50 dBm)`: "Immediate Room" (Green)
  - `Mid (-51 to -70 dBm)`: "Adjacent Room" (Amber)
  - `Far (> -70 dBm)`: "Edge of Coverage" (Red / Muted)
- [ ] **TASK-118**: Build **Mesh Node Architecture View**: visually displaying the Master Router and all connected Satellite/Extender nodes.
- [ ] **TASK-119**: Create **Mesh Node Card** showing node name (e.g. "Living Room AP", "Office Mesh", "Backyard Extender"), backhaul type (Ethernet / 5GHz Wireless), and total connected clients.
- [ ] **TASK-120**: Group devices by connected Access Point / Mesh Node in an expandable accordion view.
- [ ] **TASK-121**: Implement **Roaming Event Detection**: show an animated indicator when a device roams between Mesh Node A and Mesh Node B.
- [ ] **TASK-122**: Build **Presence Timeline Component** (visual Gantt-style horizontal bar showing active hours throughout the day).
- [ ] **TASK-123**: Display arrival and departure events with exact timestamps ("Arrived home at 5:14 PM", "Disconnected at 8:30 AM").
- [ ] **TASK-124**: Calculate total on-premises presence duration per device for the current day and past 7 days.
- [ ] **TASK-125**: Add filter to view only devices currently physically present vs. away.
- [ ] **TASK-126**: Build **Wi-Fi Radio Channel Inspector** displaying 2.4GHz, 5GHz, and 6GHz channel utilization and noise floor.
- [ ] **TASK-127**: Add "Optimize Channel" recommendation trigger if high co-channel interference is detected.
- [ ] **TASK-128**: Implement visual export of the presence log to CSV or clean JSON.
- [ ] **TASK-129**: Write unit tests for RSSI distance mapping and mesh node assignment logic.
- [ ] **TASK-130**: Verify UI clarity of mesh node layout on both small and large displays.

---

## Phase 6: Traffic, Domain History & Categorization Module (Tasks 131 - 155)

- [ ] **TASK-131**: Create domain and traffic state store (`/src/context/TrafficContext.tsx`).
- [ ] **TASK-132**: Build **Real-Time Visited Domain Stream Table** displaying live DNS/SNI resolution events.
- [ ] **TASK-133**: Design domain table columns: Timestamp, Device (with icon), Domain Name, Category Badge, Status (Allowed / Blocked / SafeSearch), Actions.
- [ ] **TASK-134**: Implement **Domain Categorization Engine** classifying domains into 8 clean tags:
  - `Streaming` (Netflix, YouTube, Spotify, Disney+)
  - `Social Media` (Instagram, TikTok, Reddit, X, Facebook)
  - `Gaming` (Steam, PlayStation, Roblox, Epic Games, Discord)
  - `Work & Productivity` (GitHub, Slack, Google Docs, Notion, Zoom)
  - `Education` (Wikipedia, Khan Academy, Coursera, Canvas)
  - `Shopping` (Amazon, eBay, Shopify)
  - `Adult Content` (Flagged & Blocked indicator)
  - `General Web / CDN` (Cloudflare, AWS, Akamai)
- [ ] **TASK-135**: Build **Favicon / Logo Resolver** for visited domains (retrieving clean 16x16 vector or favicon for top domains).
- [ ] **TASK-136**: Implement **1-Click Domain Block Button**: block any visited domain immediately from the activity stream.
- [ ] **TASK-137**: Build **Domain Search & Time Range Filter**: filter activity by last 1 hour, 6 hours, 24 hours, or 7 days.
- [ ] **TASK-138**: Build **Top Visited Domains Card**: ranking the top 10 most visited domains across the entire network with percentage bar.
- [ ] **TASK-139**: Build **Top Bandwidth Consumers Card**: visual horizontal bar chart of devices using the most data today.
- [ ] **TASK-140**: Build **Search Engine Activity & SafeSearch Insights Card**:
  - Show SafeSearch status (Active on all kid profiles).
  - Summarize high-level search categories without invading encrypted HTTPS payloads.
  - Clear user educational notice explaining HTTPS privacy and network-level policy governance.
- [ ] **TASK-141**: Implement **Live Network Speed Chart**: canvas/SVG line graph showing live WAN Ingress and Egress speeds in real-time.
- [ ] **TASK-142**: Implement **Bandwidth Quotas & Consumption Breakdown**:
  - Daily total bandwidth consumed (e.g. `42.8 GB`).
  - Monthly progress toward ISP data cap (e.g. `620 GB / 1000 GB` with clean progress bar).
- [ ] **TASK-143**: Add "Clear Browsing Logs" action with safety confirmation dialog.
- [ ] **TASK-144**: Implement auto-refresh toggle (Live Stream ON vs. Paused) with pause/play button.
- [ ] **TASK-145**: Add visual indicators for blocked tracker queries and ad domains intercepted by the gateway.
- [ ] **TASK-146**: Write unit tests for domain categorization logic and bandwidth calculation formatters.

---

## Phase 7: Device Control, Restrictions & Internet Pausing (Tasks 147 - 170)

- [ ] **TASK-147**: Create network control service store (`/src/context/ControlContext.tsx`).
- [ ] **TASK-148**: Build **Instant 1-Click Internet Pause** mechanism:
  - Fires API request to drop WAN traffic for the target MAC.
  - Instantly transitions device state on UI with optimistic update.
  - Changes device badge to red "PAUSED" pill.
  - Replaces "Pause" button with prominent "Resume" button.
- [ ] **TASK-149**: Implement **Instant 1-Click Unpause**: restores WAN forwarding immediately.
- [ ] **TASK-150**: Build **Pause All Internet (Family Dinner Mode)**:
  - Master emergency toggle in the header to freeze internet across all non-essential devices with 1 click.
  - Whitelist bypass toggle for owner's work laptop or critical IoT devices (thermostats, cameras).
- [ ] **TASK-151**: Build **Force Disconnect / Kick Device** action:
  - Prompts quick confirmation dialog.
  - Sends 802.11 deauthentication frame command to access point.
  - Removes device from active client count.
- [ ] **TASK-152**: Build **Permanent MAC Blacklist / Ban Management**:
  - Dedicated "Blacklist" tab in Rules section.
  - Add MAC address manually or directly from device card.
  - View list of banned devices with reason note and date added.
  - "Unban" action restoring full access.
- [ ] **TASK-153**: Build **Bedtime & Scheduled Curfews Manager**:
  - Weekly schedule grid (Monday through Sunday).
  - Visual time-range sliders (e.g. `9:00 PM - 7:00 AM`).
  - Assign schedule to individual devices or device groups (e.g. "Kids Tablets").
  - Visual indicator showing whether curfew is currently active.
- [ ] **TASK-154**: Build **Bandwidth Throttling / Speed Limiter Controller**:
  - Speed limit modal with slider and preset speed chips: `512 Kbps` (Text only), `2 Mbps` (Standard web), `10 Mbps` (HD video), `Unlimited`.
  - Independent Download and Upload speed caps.
  - Displays amber "THROTTLED" badge on device card when limit is active.
- [ ] **TASK-155**: Build **Category Blocking Rules**:
  - Toggles to block whole categories per device (e.g. Block Gaming, Block Social Media, Block Adult Content).
- [ ] **TASK-156**: Implement **DNS-over-HTTPS (DoH) Bypass Prevention Toggle**:
  - Enforces local DNS by blocking public DoH/DoT resolvers (ports 853, 5353, and known IPs).
- [ ] **TASK-157**: Implement **Optimistic UI Updates** with automatic rollback and toast notification if the backend rejects the control request.
- [ ] **TASK-158**: Write unit tests for control actions, schedule evaluation engine, and quota limits.

---

## Phase 8: Security, Intrusion Alerts & Threat Interception (Tasks 171 - 190)

- [ ] **TASK-171**: Create security alerts store (`/src/context/SecurityContext.tsx`).
- [ ] **TASK-172**: Build **Security Overview Dashboard Card** showing threat shield status, blocked malicious requests count, and new device alerts.
- [ ] **TASK-173**: Build **New Device Alert Notification**:
  - Triggers toast and header alert badge when an unknown MAC joins the network.
  - Features quick actions directly in the alert: **"Trust & Assign Name"** or **"Block Immediately"**.
- [ ] **TASK-174**: Build **Suspicious Activity Alert Manager**:
  - Flags attempts to resolve known phishing, malware, or botnet C2 domains.
  - Shows source device, target malicious domain, timestamp, and "Threat Neutralized" confirmation.
- [ ] **TASK-175**: Build **Bandwidth Spike / Torrent Alert**:
  - Triggers when a single device exceeds 90% of total available bandwidth for more than 3 consecutive minutes.
  - Offers 1-click "Throttle Device" action button.
- [ ] **TASK-176**: Build **Security Audit Log View**:
  - Searchable, filterable list of all security events with severity badges (Critical, High, Medium, Low).
- [ ] **TASK-177**: Build **Threat Intelligence Blocklist Integrator**:
  - Manage active DNS blocklists (e.g. StevenBlack Unified, OISD, AdGuard DNS).
  - Show total blocked domains counter (e.g. `245,180 Domains Blocked`).
  - Manual domain whitelist override input.
- [ ] **TASK-178**: Build **Wi-Fi Password / WPS Security Checker**:
  - Displays Wi-Fi encryption standard (WPA3-Personal recommended / WPA2 fallback).
  - Flags if outdated WEP or open guest network without isolation is detected.
- [ ] **TASK-179**: Implement push notification audio/visual chime (toggleable in settings) for critical security intrusions.
- [ ] **TASK-180**: Write unit tests for security alert parser, threshold triggers, and blocklist evaluator.

---

## Phase 9: Settings, Gateway Administration & Export (Tasks 181 - 198)

- [ ] **TASK-181**: Build **Settings Shell** with sub-tabs: `General`, `Theme & Display`, `Network & DHCP`, `Mesh Nodes`, `Backup & Export`.
- [ ] **TASK-182**: In `General`, allow setting Network Name (SSID), Guest Wi-Fi status, and Admin Password.
- [ ] **TASK-183**: In `Theme & Display`, provide live interactive palette switcher, font size adjust, and compact view toggle.
- [ ] **TASK-184**: In `Network & DHCP`, display Gateway IP, Subnet Mask, DHCP IP Range (`192.168.1.100 - 250`), and DNS Servers.
- [ ] **TASK-185**: Build **Static DHCP Reservation Manager**: bind specific MAC addresses to fixed IP addresses.
- [ ] **TASK-186**: In `Mesh Nodes`, allow adding/renaming mesh satellite nodes and triggering firmware checks.
- [ ] **TASK-187**: Build **Configuration Backup & Restore**: export all nicknames, schedules, and blacklists to encrypted JSON file.
- [ ] **TASK-188**: Build **Reboot Gateway / Restart Wi-Fi Radio** action with countdown safety timer.
- [ ] **TASK-189**: Build **Diagnostic Speedtest Widget**: runs local gateway-to-ISP speedtest and reports latency (ping), jitter, and bandwidth.
- [ ] **TASK-190**: Build **Factory Reset / Reset Rules** safeguard modal with double confirmation challenge.

---

## Phase 10: Backend API Gateway, WebSockets & Hardware Adapters (Tasks 191 - 215)

- [ ] **TASK-191**: Create high-performance backend server using Node.js / Express or Fastify in `/server`.
- [ ] **TASK-192**: Implement WebSocket server (`ws`) broadcasting live telemetry events (speeds, new devices, DNS logs) at 1-second intervals.
- [ ] **TASK-193**: Build comprehensive Mock Telemetry Generator simulating realistic enterprise network traffic, devices, and domain visits for standalone development.
- [ ] **TASK-194**: Implement REST API endpoint: `GET /api/system/status` (CPU load, RAM usage, uptime, gateway firmware).
- [ ] **TASK-195**: Implement REST API endpoint: `GET /api/devices` (all active and historical clients).
- [ ] **TASK-196**: Implement REST API endpoint: `GET /api/devices/:id` (detailed device profile).
- [ ] **TASK-197**: Implement REST API endpoint: `PATCH /api/devices/:id` (update nickname, category).
- [ ] **TASK-198**: Implement REST API endpoint: `POST /api/devices/:id/pause` (apply WAN drop firewall rule).
- [ ] **TASK-199**: Implement REST API endpoint: `POST /api/devices/:id/resume` (remove WAN drop firewall rule).
- [ ] **TASK-200**: Implement REST API endpoint: `POST /api/devices/:id/kick` (send 802.11 deauth packet).
- [ ] **TASK-201**: Implement REST API endpoint: `POST /api/devices/:id/block` (add to permanent MAC blacklist).
- [ ] **TASK-202**: Implement REST API endpoint: `POST /api/devices/:id/throttle` (apply `tc` traffic shaping rule).
- [ ] **TASK-203**: Implement REST API endpoint: `GET /api/traffic/live` (live bandwidth ingress/egress).
- [ ] **TASK-204**: Implement REST API endpoint: `GET /api/domains/recent` (searchable DNS log stream).
- [ ] **TASK-205**: Implement REST API endpoint: `POST /api/domains/block` (add domain to blocklist).
- [ ] **TASK-206**: Implement REST API endpoint: `GET /api/schedules` & `POST /api/schedules` (bedtime rules).
- [ ] **TASK-207**: Implement REST API endpoint: `GET /api/mesh/nodes` (AP topology & signal strength).
- [ ] **TASK-208**: Implement REST API endpoint: `GET /api/security/alerts` & `PATCH /api/security/alerts/:id` (dismiss alert).
- [ ] **TASK-209**: Build Linux/OpenWrt hardware adapter interface: executing `nftables` / `iptables` commands when running on real router hardware.
- [ ] **TASK-210**: Build `hostapd_cli` integration for live RSSI station dump and deauthentication on real Wi-Fi radios.
- [ ] **TASK-211**: Build `dnsmasq.leases` and ARP cache parser for real-time hardware discovery.
- [ ] **TASK-212**: Implement graceful shutdown and automatic state recovery on server restart.
- [ ] **TASK-213**: Set up production build optimization: code-splitting, tree-shaking, CSS minification.
- [ ] **TASK-214**: Audit bundle size ensuring total initial JavaScript bundle is under 180 KB gzipped.
- [ ] **TASK-215**: Perform end-to-end integration run-through verifying every screen, control, and theme switch functions seamlessly.
