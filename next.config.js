/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking during builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint checking during builds
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
