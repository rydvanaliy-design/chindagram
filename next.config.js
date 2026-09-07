/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },                    // no embedding in iframes
  { key: "X-Content-Type-Options", value: "nosniff" },          // don't guess content types
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // microphone=(self): voice notes in chat record via MediaRecorder on our own
  // origin — an empty allowlist would block our own recorder too.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },          // keep it out of search engines
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Uploaded photos are served from Supabase Storage, not from /public.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  // Prisma's query engine is a binary that Next's file tracing misses, so
  // Vercel would otherwise ship a function that cannot reach the database.
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": ["./node_modules/.prisma/client/**/*"],
    },
  },
};

module.exports = nextConfig;
