/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;

// Cloudflare worker bindings: use `npm run preview` (not `next dev`).
// Do NOT import @opennextjs/cloudflare here — it breaks dev CSS serving.
