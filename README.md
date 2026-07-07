# Yugen (幽玄) — Anime Stream

A profound anime streaming experience. Built with Next.js + AniList + Capacitor.

![Yugen logo](public/logo.svg)

## Features

- 📚 **Real AniList catalog** — thousands of anime with real posters, metadata, and synopses
- 🎬 **Working streaming** — scrapes Anikoto for playable HLS streams (Sub/Dub)
- 📅 **Real airing schedule** — next 7 days with countdowns
- 🔍 **Accurate search** — strict title matching (no more "Onigirl" for "demon slayer")
- 📚 **My List** — 5 categories (Watching / Completed / Plan to Watch / On Hold / Dropped)
- ▶️ **Continue Watching** — progress tracking with resume
- 🎲 **Random anime** — "Surprise me" button
- 🎬 **Full-featured player** — PiP, hold-for-2x, swipe gestures, subtitle customization, skip intro/outro, marquee titles
- ⚙️ **Persistent settings** — audio, quality, speed, subtitles, all saved to localStorage
- 🛡️ **Crash screen** — graceful error handling with report copying
- 📱 **PWA + iOS app** — installable, fullscreen, splash screens, offline catalog

## Quick start (development)

```bash
bun install
bun run dev
# Open http://localhost:3000
```

## Build the iOS IPA

### Option A: GitHub Actions (recommended, no Mac needed)

1. **Push this repo to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOURUSERNAME/yugen.git
   git push -u origin main
   ```

2. **Make sure the repo is PUBLIC** (required for free GitHub Actions macOS runners)

3. **Trigger the build:**
   - Go to your repo on GitHub
   - Click the **Actions** tab
   - Select **"Build iOS IPA"** workflow
   - Click **"Run workflow"** button (top right)
   - Wait ~20-30 minutes for the build to complete

4. **Download the IPA:**
   - When the build finishes (green ✓), click on the run
   - Scroll down to the **Artifacts** section
   - Click **Yugen-iOS-IPA** to download
   - Unzip the downloaded file → `Yugen.ipa` inside

5. **Sideload to your iPhone:**
   - Open your sideloading app (AltStore / Sideloadly / TrollStore)
   - Select `Yugen.ipa`
   - Sign in with your Apple ID when prompted
   - Install

### Option B: Local Mac build

See [IPA-BUILD.md](IPA-BUILD.md) for full instructions.

## Sideload to iPhone

After you have the `Yugen.ipa` file:

### AltStore (recommended)
1. Install AltServer on your Mac/PC → https://altstore.io
2. Connect iPhone via USB, install AltStore on iPhone
3. Open AltStore → tap **+** → select `Yugen.ipa`
4. Done — app icon appears on home screen

### Sideloadly
1. Download → https://sideloadly.io
2. Connect iPhone via USB
3. Drag `Yugen.ipa` into Sideloadly
4. Enter Apple ID → click Start

### TrollStore (permanent, no 7-day expiry)
Works on iOS 14.0–16.6.1 (and 17.0 on some devices):
1. Install TrollStore → https://github.com/opa334/TrollStore
2. Open TrollStore → Install IPA → select `Yugen.ipa`
3. Permanent install, no re-signing needed

## First launch

After sideloading, on your iPhone:
1. App shows "Untrusted Developer" on first tap
2. **Settings → General → VPN & Device Management**
3. Tap your Apple ID → **Trust**
4. Launch Yugen — it should open

## ⚠️ Free Apple ID limitations

- Sideloading with a free Apple ID **expires after 7 days**
- Re-sign via AltStore while on the same WiFi as your computer
- Use TrollStore for permanent installation (no expiry)

## Deploy as PWA (no IPA needed)

If you just want it on your phone instantly:

```bash
# Deploy to Vercel (free)
npm i -g vercel
vercel
```

Then on iPhone: open the Vercel URL in Safari → Share → Add to Home Screen.

⚠️ **Vercel free tier** has 10s function timeouts — the streaming proxy may be limited. For production streaming, deploy to a VPS (Railway, Fly.io, Render) instead.

## Tech stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **State**: Zustand (persisted to localStorage)
- **Streaming**: hls.js + custom Anikoto scraper + server-side HLS proxy
- **Catalog**: AniList GraphQL API
- **Mobile**: Capacitor 8 (iOS)
- **Animations**: Framer Motion
- **Icons**: Lucide

## Project structure

```
├── .github/workflows/
│   └── build-ipa.yml          # GitHub Action that builds the IPA
├── public/
│   ├── logo.svg               # Yugen logo
│   ├── icon-*.png             # App icons (192, 512, 1024)
│   ├── apple-touch-icon.png   # iOS home screen icon
│   ├── splash/                # iOS launch screens
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── src/
│   ├── app/
│   │   ├── api/               # API routes (stream proxy, anime, providers)
│   │   ├── layout.tsx         # Root layout with PWA meta tags
│   │   ├── page.tsx           # Main app page
│   │   └── globals.css        # Theme + iOS optimizations
│   ├── components/
│   │   ├── app/               # AppShell, Settings, MyList, etc.
│   │   ├── anime/             # Cards, hero carousel, detail sheet
│   │   └── player/            # VideoPlayer, ProviderSheet, WatchView
│   └── lib/
│       ├── anilist.ts         # AniList GraphQL client
│       ├── streaming/         # Anikoto scraper + resolver
│       └── settings.ts        # Zustand store (persisted)
├── capacitor.config.ts        # Capacitor iOS config
├── IPA-BUILD.md               # Detailed Mac build instructions
└── README.md                  # This file
```

## Credits

- Anime data from [AniList](https://anilist.co)
- Streaming via [Anikoto](https://anikototv.to) (reverse-engineered API)
- Inspired by [Miruro](https://miruro.tv) UI design and [Th3-Anime](https://github.com/Th3-Anime/Th3-Anime) feature set

## License

For educational purposes only. Support official anime releases.
