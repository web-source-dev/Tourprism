import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/media/**', // Or a more specific path if needed
      },
      // Add other hostnames here if necessary
    ],
  },
};

export default nextConfig;
