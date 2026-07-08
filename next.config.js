/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Local photos live in /public/images — no remote domains needed yet.
    // If you later host images on a CDN or the Rezdy API returns image URLs,
    // add those hostnames here, e.g.:
    // remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }]
    remotePatterns: []
  }
};

module.exports = nextConfig;
