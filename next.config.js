/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build output dir is env-overridable so `next build` can target a separate
  // folder from the running `next dev` (which holds a lock on .next on Windows).
  distDir: process.env.NEXT_DIST_DIR || '.next',
}
module.exports = nextConfig
