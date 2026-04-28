/** @type {import('next').NextConfig} */
const backendBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";
const normalizedBackendBase = backendBase.replace(/\/+$/, "");

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${normalizedBackendBase}/api/:path*`
      },
      {
        source: "/health",
        destination: `${normalizedBackendBase}/health`
      }
    ];
  }
}

module.exports = nextConfig
