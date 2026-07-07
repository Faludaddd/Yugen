import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/app/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yugen.app"),
  title: "Yugen — Anime Stream",
  description: "Yugen (幽玄) — a profound anime streaming experience. Browse the AniList catalog, watch in HD with Sub/Dub, real airing schedule, and a clean app-style interface.",
  keywords: ["yugen", "anime", "streaming", "AniList", "anime stream", "watch anime"],
  authors: [{ name: "Yugen" }],
  applicationName: "Yugen",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yugen",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/apple-touch-icon.png"],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Yugen — Anime Stream",
    description: "A profound anime streaming experience. Browse, watch, and track anime in HD.",
    type: "website",
    images: ["/icon-512.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yugen — Anime Stream",
    description: "A profound anime streaming experience.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* iOS PWA splash screens for all iPhone/iPad sizes */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1668x2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        {/* Prevent iOS auto-detecting phone numbers */}
        <meta name="format-detection" content="telephone=no" />
        {/* Disable tap highlight */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <ServiceWorkerRegistration />
        <Toaster />
        <SonnerToaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </body>
    </html>
  );
}
