import type { NextConfig } from "next";

// Deliberately not a strict nonce-based CSP: this app leans heavily on
// inline styles (Framer Motion, Three.js/WebGL, hundreds of style={{}}
// usages) and Next's own inline hydration scripts, so 'unsafe-inline'
// stays on script/style rather than risk breaking the app chasing a
// perfect policy. The parts that matter most for this app's actual threat
// model — clickjacking (frame-ancestors), MIME sniffing, and locking
// object/base — are still fully enforced.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      {
        // Cached by browsers/service worker — never let an update sit
        // stale, and don't let a CSP header on the worker script itself
        // restrict what it's allowed to do.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
