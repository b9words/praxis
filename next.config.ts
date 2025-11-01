import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Note: instrumentationHook is handled via instrumentation.ts file in Next.js 15+
  webpack: (config, { isServer }) => {
    // Suppress OpenTelemetry/Sentry import trace warnings
    config.module = config.module || {}
    config.module.exprContextCritical = false
    config.module.unknownContextCritical = false
    config.module.wrappedContextCritical = false
    
    // Ignore critical dependency warnings from OpenTelemetry and Sentry
    const existingIgnoreWarnings = config.ignoreWarnings || []
    config.ignoreWarnings = [
      ...existingIgnoreWarnings,
      { module: /node_modules\/@opentelemetry/ },
      { module: /node_modules\/@sentry/ },
      /Critical dependency: the request of a dependency is an expression/,
      /node_modules\/@opentelemetry/,
      /node_modules\/@sentry/,
    ]
    
    return config
  },
};

export default withBundleAnalyzer(nextConfig);
