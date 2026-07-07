# Building the Yugen IPA for iOS Sideloading

This guide walks you through turning the Yugen web app into an installable IPA that you can sideload on your iPhone using AltStore, Sideloadly, or TrollStore.

## Prerequisites

- **macOS** (required — Xcode only runs on Mac)
- **Xcode 15+** (free from the Mac App Store)
- **Apple ID** (free works for sideloading, no paid developer account needed)
- **Node.js 18+** and **Bun** (already installed)
- **CocoaPods** (`sudo gem install cocoapods`)
- An iOS sideloading tool:
  - **AltStore** (recommended, easiest) — https://altstore.io
  - **Sideloadly** — https://sideloadly.io
  - **TrollStore** (jailbreak-free, permanent) — for iOS 14-16.6.1

## Step 1: Build the web assets

```bash
cd /home/z/my-project
bun install
bun run build
```

This produces a production Next.js build in `.next/standalone/`.

## Step 2: Add the iOS platform (first time only)

```bash
bun run cap:add:ios
```

This creates the `ios/` directory with the Xcode project.

## Step 3: Sync web assets to the native project

```bash
bun run cap:sync
```

This copies your built web app into the iOS project and updates native plugins.

## Step 4: Open in Xcode

```bash
bun run cap:open
```

Or manually open `ios/App/App.xcworkspace` in Xcode.

## Step 5: Configure signing in Xcode

1. In Xcode, click the **App** project in the left sidebar
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Under **Team**, select your Apple ID (sign in with your Apple ID if prompted)
6. Change the **Bundle Identifier** to something unique, e.g. `com.yourname.yugen`
7. Make sure no errors appear (red text)

## Step 6: Build the IPA

### Option A: Archive in Xcode (recommended)

1. In Xcode, select **Any iOS Device (arm64)** as the build target (not a simulator)
2. Go to **Product → Archive** (this takes a few minutes)
3. When the archive completes, the Organizer window opens
4. Click **Distribute App**
5. Select **Custom** → **Development** (or **Ad Hoc** for multiple devices)
6. Follow the prompts to export the `.ipa` file to your Desktop

### Option B: Command-line build

```bash
cd ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -archivePath build/App.xcarchive archive
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build/ipa -exportOptionsPlist ../exportOptions.plist
```

The IPA will be at `ios/App/build/ipa/Yugen.ipa`.

## Step 7: Sideload on your iPhone

### Method 1: AltStore (recommended, easiest)

1. Install **AltServer** on your Mac from https://altstore.io
2. Connect your iPhone to your Mac via USB
3. Open AltServer and choose **Install AltStore** → your iPhone
4. On your iPhone, open AltStore
5. Tap the **+** button in the top-left
6. Select the `Yugen.ipa` file (in the Files app)
7. AltStore installs it — you're done!

**Note**: Free Apple ID signing lasts 7 days. Re-sign by opening AltStore while on the same WiFi as your Mac.

### Method 2: Sideloadly

1. Download **Sideloadly** from https://sideloadly.io
2. Connect your iPhone via USB
3. Drag the `Yugen.ipa` into Sideloadly
4. Enter your Apple ID
5. Click **Start** — Sideloadly installs it directly

### Method 3: TrollStore (permanent, no re-signing)

If your iPhone runs iOS 14.0–16.6.1 (or 17.0 on some devices):

1. Install **TrollStore** following the guide at https://github.com/opa334/TrollStore
2. Open TrollStore
3. Tap **Install IPA** and select `Yugen.ipa`
4. The app installs permanently — no 7-day re-signing needed

## Step 8: Trust the developer (first launch)

After sideloading, the app icon appears on your home screen. On first launch:

1. You'll see "Untrusted Developer"
2. Go to **Settings → General → VPN & Device Management**
3. Tap your Apple ID under "Developer App"
4. Tap **Trust [Your Apple ID]**
5. Confirm with **Trust**
6. Launch Yugen — it should open

## Customization

### Change the app name
Edit `capacitor.config.ts` → `appName: 'Yugen'`

### Change the bundle ID
In Xcode → App target → Signing & Capabilities → Bundle Identifier

### Change app icons
Replace the icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` or re-run `bun run icons` then `bun run cap:sync`.

### Change splash screen
Replace the images in `ios/App/App/Assets.xcassets/Splash.imageset/` or update `scripts/generate-icons.py` and re-run.

## Troubleshooting

### "Cannot connect to server" when opening the app
- The app loads from local files, so it needs the Next.js standalone server running
- For a fully offline app, you need to use `next export` (static export) instead of standalone
- Alternatively, host the web app on a server and point `capacitor.config.ts` → `server.url` to it

### App crashes on launch
- Open the project in Xcode and run on a connected device — Xcode shows the crash log
- Most common cause: missing native plugin or wrong Bundle ID

### Video doesn't play
- iOS WKWebView has stricter CORS rules than desktop Safari
- The `/api/proxy` route handles this server-side, but the server must be reachable
- For fully offline playback, you'd need to download episodes (not yet implemented)

### 7-day expiration (free sideloading)
- Free Apple ID signing expires after 7 days
- Use AltStore's "Refresh All" feature while on WiFi with your Mac
- Or use TrollStore for permanent installation

## Need help?

Open an issue on GitHub: https://github.com/yourusername/yugen
