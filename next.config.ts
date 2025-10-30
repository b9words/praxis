import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable Sentry instrumentation
  experimental: {
    instrumentationHook: true,
  } as any,
};

export default withBundleAnalyzer(nextConfig);
