import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// @ts-expect-error - next-pwa does not have perfect type definitions
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
