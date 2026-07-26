# AIMO Music Bot — Website

The official website for **AIMO Music Bot** — a powerful, free Discord music bot with AI chat, custom playlists, 10+ audio filters, mini games, and 15-language support.

---

## 🌐 Live Site

| Environment | URL |
|---|---|
| Development | `http://localhost:5000` (via `node server.js`) |
| Production | Deployed via Replit / your hosting provider |

---

## 📁 Project Structure

```
aimo-website/
│
├── server.js          # Node.js HTTP server — serves all pages, proxies webhook + Lavalink
├── config.js          # Client-side config: webhook URL, bot avatar CDN
├── style.css          # Full design system (purple/pink, Inter+Poppins, all components)
├── script.js          # Visitor logger (geo/battery), activity tracker, nav, ripple, audio player
├── cookie.js          # Multi-language cookie consent banner (15 languages) + detailed logging
│
├── index.html         # Home page — hero, 6-card feature grid, music player demo, stats, CTA
├── features.html      # Deep-dive feature sections (01–09) with animated Discord demo cards
├── commands.html      # Full slash command reference with search + category filter
├── premium.html       # Pricing page — Free vs Premium, feature comparison, FAQ
├── status.html        # Live status — real-time graph, 90-day uptime bars, Lavalink stats
├── docs.html          # Documentation — sidebar layout, 13 pages, helpful feedback buttons
├── updates.html       # Changelog / update log
├── terms.html         # Terms of Service
├── privacy.html       # Privacy Policy
├── support.html       # Support / Discord server redirect page
├── owner.html         # Owner-only: file browser + ZIP download (password: 078)
│
├── logo.webp          # Bot avatar — used in nav, footer, Discord demo cards
├── starboy.mp3        # Audio file — used in the hero music player demo on index.html
└── README.md          # This file
```

---

## 🚀 Running the Server

```bash
node server.js
```

The server starts on **port 5000** (or `$PORT` env var). Open `http://localhost:5000`.

No npm install required — uses only Node.js built-ins (`http`, `fs`, `path`, `child_process`) plus the global `fetch` API (Node 18+).

---

## 📡 Server Architecture

### Routes

| Route | Serves |
|---|---|
| `/` | `index.html` |
| `/features` | `features.html` |
| `/commands` | `commands.html` |
| `/premium` | `premium.html` |
| `/status` | `status.html` |
| `/docs` | `docs.html` |
| `/updates` | `updates.html` |
| `/terms` | `terms.html` |
| `/privacy` | `privacy.html` |
| `/support` | `support.html` |
| `/owner` | `owner.html` |
| `/invite` | Redirect → Discord OAuth |
| `/discord` | Redirect → Support server |
| `/vote` | Redirect → Top.gg |
| `/api/log` | POST proxy → Discord webhook (hides webhook URL from client) |
| `/api/lavalink/stats` | Proxy → Lavalink `/v4/stats` |
| `/api/lavalink/info` | Proxy → Lavalink `/v4/info` |
| `/owner/files` | JSON file list (requires `?pass=078`) |
| `/owner/download` | ZIP download of entire project (requires `?pass=078`) |
| `/owner/download-file` | Download individual file (requires `?pass=078`) |

---

## 🤖 Visitor Tracking — How It Works

AIMO uses a **two-layer tracking system** to capture all visitors — including bots and crawlers that never execute JavaScript.

### Layer 1: Server-Side (server.js) — Catches EVERYONE

Every time an HTML page is requested (`GET /`, `/features`, etc.), `server.js` fires a Discord webhook **before** serving the file. This runs on the Node.js server, so:

- ✅ Captures bots, web crawlers, Googlebot, search engine spiders
- ✅ Captures anyone who has JavaScript disabled
- ✅ Captures server-side rendering tools, curl, wget, Python scripts
- ✅ Captures all human visitors

**What it logs:**
- Real IP address (from `X-Forwarded-For` → `X-Real-IP` → socket)
- Server-side geo lookup via `ipwho.is/{ip}` (with fallback to `ipapi.co`)
- Country flag emoji + Google Maps link to coordinates
- User-Agent string (with bot detection)
- Referrer, Accept-Language, page path
- Timestamp

**Deduplication:** Same IP + page within 60 seconds is suppressed to avoid log spam on refreshes.

### Layer 2: Client-Side (script.js) — Enriches Human Visits

For human visitors who execute JavaScript, `script.js` logs an additional 3-embed detailed report:

- Browser fingerprint (browser, OS, device type, touch support, pixel ratio)
- Hardware info (RAM, CPU cores, battery level/charge/time)
- Network info (connection type, downlink speed, RTT)
- Language(s), timezone, screen resolution, viewport
- Visit count (localStorage), session ID (sessionStorage)
- Referrer, page title, local + UTC timestamps
- Bot detection via `navigator.webdriver`, User-Agent pattern matching

**Geo:** Uses a 3-provider fallback chain: `ipwho.is` → `ipapi.co` → `freeipapi.com`

### Layer 3: Activity Tracker (script.js) — Behavioral Events

The activity tracker logs user interactions:

| Event | Trigger |
|---|---|
| Button/link click | CTA buttons, nav links, invite, support, vote, docs, premium |
| Music player play | Audio play event |
| Music player pause | Audio pause event + seconds listened |
| Track finished | Audio ended event |
| Song liked / unliked | Heart button click |
| Scroll milestone | 25%, 50%, 75%, 100% scroll depth |
| Docs feedback | Helpful / Not Helpful button click (with section name) |
| Feature card hover | First hover on each feature/stat/perk card |
| Page exit | `pagehide` + `beforeunload` with time spent + max scroll depth |

### Layer 4: Cookie Consent (cookie.js) — Consent Decision

When a visitor accepts or declines the cookie banner:

- Decision (ACCEPTED / DECLINED) in bold color
- Real IP + geo (server-side geo lookup)
- Banner language (which of 15 languages was shown)
- Browser language, page, session ID
- Time spent on page before deciding
- User-Agent

---

## 🍪 Cookie Banner

**File:** `cookie.js`  
**Trigger:** Fires 1.2 seconds after page load, only if `aimo_cookie_consent` cookie is not set  
**Languages:** 15 (English, Spanish, French, German, Portuguese, Italian, Dutch, Russian, Japanese, Korean, Chinese, Arabic, Turkish, Polish, Swedish)  
**Language detection:** Automatic via `navigator.language`  
**Cookie lifetime:** 365 days  
**Design:** Slides up from bottom, dark glass card matching site theme  

---

## 📊 Status Page

**File:** `status.html`  
**Data source:** `/api/lavalink/stats` → proxied to `http://5.39.63.207:9261/v4/stats` with auth header `glace`  
**Poll interval:** Every 5 seconds  

### What's shown:
- **Overall badge:** `✅ All Systems Operational` / `🔴 Service Unavailable` in hero
- **UP/DOWN pill:** Large colour-coded pill — green `▲ UP` or red `▼ DOWN`
- **Real-time line graph:** 60-point rolling window, green gradient when online, red when offline, with glowing dot at latest point
- **Big numbers:** 30-day availability %, server uptime, active players, memory used
- **90-day uptime bars:** 90 coloured bars (green/amber/red) generated randomly except the last bar which reflects live status
- **Server detail cards:** System status, CPU load, Lavalink cores, active players
- **Countdown timer:** Shows "Next check in Ns" refreshing each second

No "active users" count is shown anywhere on the status page.

---

## ✨ Features Page

**File:** `features.html`  
**Sections:** 9 numbered feature sections with animated demo cards

| # | Feature | Demo Card |
|---|---|---|
| 01 | Music Engine | Animated EQ + player card |
| 02 | Queue Management | Queue list with cycling active track |
| 03 | Audio Filters | EQ bars + filter chip grid |
| 04 | AI Chat | Cycling Q&A pairs with typing indicator |
| 05 | Playlists | Animated playlist list |
| 06 | Mini Games | 2×3 game grid with rotating highlight |
| 07 | Language Support | Discord select component animation |
| 08 | Search & Select | Cycling song result list |
| 09 | Customize | Discord admin customize demo |

**All 9 cards float** with the `float-card` CSS animation. Each section has a staggered `animation-delay` so they don't all move in sync.

---

## 📖 Docs Page

**File:** `docs.html`  
**Pages:** 13 sections navigated via sidebar  
**Helpful feedback:** Every section has Yes/No buttons wired to `data-helpful="true/false"`. The `script.js` activity tracker picks these up and logs the section name + decision to Discord.

**Sections:**
- Introduction, Quick Start
- Playing Music, Queue, Controls, Audio Filters
- Playlists, Favourites
- AI Chat, Lyrics, Mini Games
- Supported Languages
- Premium Overview

---

## 💎 Premium Page

**File:** `premium.html`  
**Pricing:** Free vs Premium cards with animated star-ring hero, feature list comparison, 6 animated perk cards, 3-step "How to Get Premium" flow, and a 4-item FAQ accordion.

**Premium features unlocked:**
- Speed Control (`/speed`) — 0.5× to 3.0×
- Advanced Bass Boost (`/boost`)
- Reverb & Echo (`/reverb`)
- Stereo Widening (`/stereo`)
- Nightcore Mode (`/nightcore`)
- Priority support + early access

---

## 🔧 Discord Webhook

The webhook URL is stored **server-side only** in `server.js` (hardcoded). It is **never exposed** to the browser — all client-side code sends to `/api/log`, which the server proxies to Discord.

This prevents:
- Rate-limit issues from many client IPs hitting Discord directly
- Webhook URL leaking via browser DevTools / network inspection

The proxy handles Discord's 429 rate-limit responses and returns `{ retry_after }` to the client.

---

## 🎨 Design System

All styles are in `style.css`. Key tokens:

```css
--purple: #7c3aed
--pink: #ec4899
--gradient: linear-gradient(135deg, #7c3aed, #ec4899)
--text: #111827
--text-muted: #6b7280
--bg-alt: #f8f7ff
--border: #e5e7eb
--shadow: 0 4px 24px rgba(124,58,237,.08), …
--shadow-lg: 0 12px 48px rgba(124,58,237,.16), …
--nav-h: 68px
```

**Fonts:** Inter (body), Poppins (headings/buttons)  
**Animations:** `float-card`, `blink`, `prog-anim`, `mc-eq-anim`, `fav-spin`, `spin`, `psr-spin`  
**Reveal:** `.reveal` elements animate in via IntersectionObserver (adds `.in` class)  

---

## 🔑 Owner Tools

Protected by `?pass=078`:

| Endpoint | Description |
|---|---|
| `/owner` | Owner dashboard page |
| `/owner/files?pass=078` | JSON list of all project files with sizes |
| `/owner/download-file?pass=078&file=path` | Download any single file |
| `/owner/download?pass=078` | Download entire project as ZIP |

---

## 🤝 Bot Info

| Property | Value |
|---|---|
| Bot Name | AIMO Music Bot |
| Client ID | `1466757680311042060` |
| Top.gg ID | `1483826024520089710` |
| Support Server | `discord.gg/2S2u3QE4Tr` |
| Contact | `aimo-bot@protone.me` |
| Permissions | `2151009280` |
| Slash commands | 55+ |
| Languages | 15 |
| Lavalink host | `5.39.63.207:9261` (auth: `glace`) |

---

## 📝 Key Files Reference

| File | Purpose |
|---|---|
| `server.js` | HTTP server, page routing, API proxies, server-side tracking |
| `config.js` | Client config (`window.AIMO_CONFIG`) — webhook path, bot avatar URL |
| `script.js` | Visitor log (3 embeds), activity tracker, nav, ripple, player, command search |
| `cookie.js` | Cookie consent banner (15 langs) + acceptance/decline webhook log |
| `style.css` | Complete design system — tokens, components, animations |
| `index.html` | Home page with hero, features overview, music player demo |
| `features.html` | Deep-dive features with 9 animated Discord/UI demo cards |
| `commands.html` | Full command list with search + category filter |
| `premium.html` | Pricing, perks, FAQ, how-to-get guide |
| `status.html` | Live Lavalink status graph — no active-users count |
| `docs.html` | 13-page documentation with sidebar, code blocks, helpful feedback |
