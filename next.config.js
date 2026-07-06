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
};

module.exports = nextConfig;
