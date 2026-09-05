import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.ARGUS_BACKEND_URL || 'http://localhost:4000';
    return [{ source: '/argus-api/:path*', destination: `${backendUrl}/:path*` }];
  },
};

export default nextConfig;
