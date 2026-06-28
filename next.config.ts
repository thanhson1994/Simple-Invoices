import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * SECURITY CONFIGURATION
   * 
   * Additional security headers and settings for production deployment
   */
  
  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Turbopack configuration (empty config to acknowledge Turbopack usage)
  turbopack: {},

  // Additional security headers (complementing middleware headers)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },

  // Webpack configuration to prevent accidental secret exposure
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure server-only code is not bundled in client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
