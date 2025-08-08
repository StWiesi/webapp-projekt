/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking during builds - für Development deaktivieren
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // ESLint checking during builds - für Development deaktivieren
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  // Performance-Optimierungen
  swcMinify: true,
  experimental: {
    // Optimiertes Compiling
    optimizeCss: true,
    // Schnelleres Hot Reload
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Webpack-Optimierungen
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Development-spezifische Optimierungen
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
    }
    return config;
  },
}

module.exports = nextConfig
