/** @type {import('next').NextConfig} */
const isCapacitor = process.env.IS_CAPACITOR === 'true' && process.env.NODE_ENV === 'production'

const nextConfig = {
  output: isCapacitor ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable file tracing for static export (Capacitor) builds to avoid
  // ENOENT crash on _not-found trace files (Next.js 14 known issue)
  outputFileTracing: !isCapacitor,
}
module.exports = nextConfig
