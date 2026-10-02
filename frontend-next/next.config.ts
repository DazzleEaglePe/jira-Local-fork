import type { NextConfig } from "next"

// Vikunja Go backend (vikunja.exe). The browser only talks to this Next server;
// /api/* is proxied so requests stay same-origin (no CORS).
const VIKUNJA_API_URL = process.env.VIKUNJA_API_URL ?? "http://127.0.0.1:3456"

const nextConfig: NextConfig = {
  // Dev only: the team opens the app through 127.0.0.1 / the LAN IP, not "localhost"
  allowedDevOrigins: ["127.0.0.1", "172.20.16.141"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${VIKUNJA_API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
