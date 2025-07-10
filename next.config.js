/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['upload.wikimedia.org', 'dummyimage.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Optimize image sizes and quality to reduce transformations
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 days
  },

  // PostHog API rewrites
  async rewrites() {
    return [
      {
        source: "/images/dishes/:filename",
        destination:
          "/_next/image?url=%2Fimages%2Fdishes%2F:filename&w=1080&q=75",
      },
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/images/dishes/:filename",
        headers: [
          {
            key: "Content-Disposition",
            value: "attachment; filename=:filename",
          },
        ],
      },
    ];
  },

  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

if (process.env.NEXT_PUBLIC_VERCEL_URL) {
  nextConfig.images.remotePatterns.push({
    protocol: 'https',
    hostname: process.env.NEXT_PUBLIC_VERCEL_URL,
  });
}

module.exports = nextConfig;
