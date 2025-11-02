# Environment Variables Verification

This document lists all environment variables required for production and staging deployments.

## Required for All Environments

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)

### Sentry (Error Monitoring)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for client-side error tracking
- `SENTRY_DSN` - Sentry DSN for server-side error tracking (optional, can use NEXT_PUBLIC_SENTRY_DSN)
- `SENTRY_AUTH_TOKEN` - Sentry auth token for source map uploads (required for production)
- `SENTRY_ORG` - Sentry organization slug (required for source map uploads)
- `SENTRY_PROJECT` - Sentry project slug (required for source map uploads)
- `NODE_ENV` - Environment name: `production` or `staging`

### Application
- `NEXT_PUBLIC_APP_URL` - Base URL of the application (e.g., `https://execemy.com`)

### Analytics (PostHog)
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key (client-side)
- `POSTHOG_API_KEY` - PostHog project API key (server-side)
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL (defaults to `https://us.i.posthog.com`)

## Production-Specific

### Email Service (Resend)
- `RESEND_API_KEY` - Resend API key for transactional emails
- `RESEND_FROM_EMAIL` - Sender email address (defaults to `noreply@execemy.com`)

### Payment Processing (Paddle)
- `PADDLE_PUBLIC_KEY` - Paddle public key for webhook signature verification

### Staging Considerations
- **Staging should use a separate Supabase project** to avoid data conflicts
- Use staging-specific Sentry project/DSN for error isolation
- Use Paddle sandbox keys for staging environment
- `NEXT_PUBLIC_APP_URL` should point to staging domain

## Verification Checklist

Before deploying to production/staging:

- [ ] All Supabase variables set with correct project credentials
- [ ] Sentry DSNs configured and pointing to correct projects
- [ ] Sentry source map upload configured (SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT)
- [ ] PostHog keys configured (NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_API_KEY)
- [ ] Resend API key valid and from email domain verified
- [ ] Paddle public key matches environment (production vs sandbox)
- [ ] `NEXT_PUBLIC_APP_URL` matches deployment domain
- [ ] Staging uses separate Supabase project (if applicable)
- [ ] All environment variables set in Vercel dashboard (not in `.env.local`)

## Testing Environment Variables

Run the environment check script:
```bash
npm run check-env
# or
tsx scripts/check-env.ts
```

## References

- Sentry config: `sentry.client.config.ts`, `sentry.server.config.ts`
- Email service: `lib/email.ts`
- Paddle webhook: `app/api/webhooks/paddle/route.ts`

