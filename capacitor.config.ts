import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for building the Yugen iOS app (IPA).
 *
 * Build steps (see IPA-BUILD.md for full instructions):
 *   1. bun run build          (builds the Next.js standalone app)
 *   2. bun run cap:sync       (copies web assets + adds native plugins)
 *   3. Open ios/App/App.xcworkspace in Xcode
 *   4. Set your signing team (free Apple ID works for sideloading)
 *   5. Product → Archive → export as IPA
 *   6. Sideload via AltStore, Sideloadly, or TrollStore
 */
const config: CapacitorConfig = {
  appId: 'com.yugen.anime',
  appName: 'Yugen',
  webDir: 'out',  // Next.js static export output directory
  backgroundColor: '#080808',
  ios: {
    contentInset: 'always',
    backgroundColor: '#080808',
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#080808',
      iosSpinnerStyle: 'small',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#b5a8ff',
      androidScaleType: 'centerCrop',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#080808',
      overlaysWebView: true,
    },
    App: {
      // Default config
    },
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
};

export default config;
