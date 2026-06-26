/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'heat.nz',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://www.google-analytics.com https://ssl.google-analytics.com https://api.heat.nz",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/blog/electric-vs-hydronic-underfloor-heating',
        destination: '/services/electric-underfloor-heating',
        permanent: true,
      },
      {
        source: '/blog/underfloor-heating-maintenance-tips',
        destination: '/services/electric-underfloor-heating',
        permanent: true,
      },
      {
        source: '/services/underfloor-heating',
        destination: '/services/electric-underfloor-heating',
        permanent: true,
      },
      {
        source: '/services/hydronic-underfloor-heating',
        destination: '/services/electric-underfloor-heating',
        permanent: true,
      },
      {
        source: '/services/heating-maintenance',
        destination: '/services/electric-underfloor-heating',
        permanent: true,
      },
      {
        source: '/blog/choosing-right-underfloor-heating-system-auckland',
        destination: '/services/electric-underfloor-heating',
        permanent: true,
      },
      {
        source: '/blog/energy-efficient-heating-solutions',
        destination: '/services/electric-underfloor-heating',
        permanent: true,
      },
      {
        source: '/blog/renovation-heating-options',
        destination: '/services/electric-underfloor-heating',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
}

module.exports = nextConfig
