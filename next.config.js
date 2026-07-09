/** @type {import('next').NextConfig} */
const nextConfig = {
  output:
    process.env.IS_CAPACITOR === 'true' && process.env.NODE_ENV === 'production'
      ? 'export'
      : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}
module.exports = nextConfig
