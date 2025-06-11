/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['upload.wikimedia.org', 'dummyimage.com'],
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

module.exports = nextConfig;
