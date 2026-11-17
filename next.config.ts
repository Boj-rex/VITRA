import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.supabase.co https://*.paystack.co https://*.paystack.com https://lh3.googleusercontent.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co https://*.paystack.com https://generativelanguage.googleapis.com https://api.openai.com",
  "frame-src 'self' https://checkout.paystack.com https://standard.paystack.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paystack.com",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  serverExternalPackages: ["unpdf"],
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "localhost:3000",
    "localhost",
    "127.0.0.1:3000",
    "127.0.0.1",
    "10.0.25.128",
    "10.0.25.128:3000",
    "10.0.25.190",
    "10.0.25.190:3000",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.paystack.co\" \"https://checkout.paystack.com\")",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
