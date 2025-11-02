import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Production: Should fail on type errors, but keeping this for now during transition
  // TODO: Set to false before production cut
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    unoptimized: true, // Since we're using Unsplash Source which handles optimization
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

// Sentry automatically handles source map upload when SENTRY_AUTH_TOKEN is set
// The @sentry/nextjs plugin handles this in the build process
const configWithSentry = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(withBundleAnalyzer(nextConfig), {
      // Sentry source map upload configuration
      silent: true, // Suppress logs during build
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : withBundleAnalyzer(nextConfig);

export default configWithSentry;
