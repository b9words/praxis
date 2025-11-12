import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Production: Fail on type errors to ensure type safety
  typescript: {
    ignoreBuildErrors: false,
  },
  // Redirects: simulations -> library/case-studies, case-studies -> library/case-studies
  async redirects() {
    return [
      {
        source: '/simulations/:path*',
        destination: '/library/case-studies/:path*',
        permanent: true,
      },
      {
        source: '/api/simulations/:path*',
        destination: '/api/case-studies/:path*',
        permanent: true,
      },
      {
        source: '/case-studies',
        destination: '/library/case-studies',
        permanent: true,
      },
      {
        source: '/case-studies/:caseId',
        destination: '/library/case-studies/:caseId',
        permanent: true,
      },
      {
        source: '/case-studies/:caseId/tasks',
        destination: '/library/case-studies/:caseId/tasks',
        permanent: true,
      },
      {
        source: '/simulations/:slug/brief',
        destination: '/library/case-studies',
        permanent: true,
      },
    ]
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
    // Image optimization is disabled because Unsplash Source API handles optimization natively
    // This reduces Next.js build overhead and leverages Unsplash's CDN for optimal image delivery
    unoptimized: true,
  },
  // Security headers (conservative approach - no CSP to avoid breaking third-party scripts)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Strict-Transport-Security only in production (HTTPS required)
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ]
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
    
    // For client-side builds, ignore Node.js built-in modules that are dynamically imported
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
      
    }
    
    return config
  },
};

// Sentry automatically handles source map upload when SENTRY_AUTH_TOKEN is set
// The @sentry/nextjs plugin handles this in the build process
// Disable source map uploads if SENTRY_DISABLE_UPLOAD is set (useful for CI/offline builds)
const configWithSentry = process.env.SENTRY_AUTH_TOKEN && !process.env.SENTRY_DISABLE_UPLOAD
  ? withSentryConfig(withBundleAnalyzer(nextConfig), {
      // Sentry source map upload configuration
      silent: true, // Suppress logs during build
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      // Delete source maps after upload to avoid serving them to users
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
    })
  : withBundleAnalyzer(nextConfig);

export default configWithSentry;
