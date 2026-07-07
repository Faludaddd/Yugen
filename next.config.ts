import type { NextConfig } from "next";

const isExport = process.env.BUILD_MODE === "export";

const nextConfig: NextConfig = {
  // For IPA/PWA: use static export (no server, just HTML/CSS/JS files)
  // For dev/server: use standalone (Node.js server with API routes)
  output: isExport ? "export" : "standalone",
  // Static export needs trailing slashes for client-side routing
  trailingSlash: isExport,
  // Disable image optimization for static export (uses raw URLs)
  images: isExport ? { unoptimized: true } : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
