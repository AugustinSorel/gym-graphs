!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import('next').NextConfig} */

import withPWA from "next-pwa";

const nextConfig = {
  ...withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
  }),
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
