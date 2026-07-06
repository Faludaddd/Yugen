import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yugen — Anime Stream",
  description: "Yugen (幽玄) — a profound anime streaming experience. Browse the AniList catalog, watch in HD with Sub/Dub, real airing schedule, and a clean app-style interface.",
  keywords: ["yugen", "anime", "streaming", "AniList", "anime stream", "watch anime"],
  authors: [{ name: "Yugen" }],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Yugen — Anime Stream",
    description: "A profound anime streaming experience. Browse, watch, and track anime in HD.",
    type: "website",
    images: ["/logo-lockup.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yugen — Anime Stream",
    description: "A profound anime streaming experience.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
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
