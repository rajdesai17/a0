/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  compress: true,
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Enable production source maps for better debugging (optional)
  productionBrowserSourceMaps: false,

  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-scroll-area', '@radix-ui/react-tabs'],
  },

  // Set appropriate headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|gif|ico|webp)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
    ]
  },
}

export default nextConfig
