# Observability Setup Guide

This guide documents the minimal observability setup required for v1 launch.

## PostHog Dashboard Setup

### Step 1: Create Launch Funnel

1. Go to PostHog → Insights → New Insight
2. Select "Funnel" type
3. Add steps in order:
   - Step 1: `$pageview` (filter: pathname contains `/pricing` or `/signup`)
   - Step 2: `user_signed_up`
   - Step 3: `onboarding_completed`
   - Step 4: `lesson_viewed` (first lesson)
   - Step 5: `lesson_completed` (first lesson)
4. Set date range: Last 7 days
5. Save as "Launch Funnel"

### Step 2: Create Dashboard

1. Go to PostHog → Dashboards → New Dashboard
2. Name: "Launch Monitoring"
3. Add insights:
   - Launch Funnel (created above)
   - New insight: `user_signed_up` count (Last 7 days)
   - New insight: `onboarding_completed` count (Last 7 days)
   - New insight: `subscription_started` count (Last 7 days)
4. Set refresh interval: 1 hour
5. Share with team

### Step 3: Set Up Alerts

1. Go to PostHog → Alerts → New Alert
2. Select: Launch Funnel
3. Condition: Conversion rate < 30% (signup → onboarding)
4. Notification: Email/Slack
5. Save

**Additional Alert**:
- Condition: `subscription_started` count drops > 50% week-over-week
- Notification: Email/Slack

## Sentry Alert Setup

### Step 1: Verify Environment Tags

1. Go to Sentry → Settings → Projects → [Your Project]
2. Verify environment tags are set correctly:
   - `production` for production
   - `development` for local dev
3. Check that releases are being tracked

### Step 2: Create Alerts

1. Go to Sentry → Alerts → Create Alert Rule
2. **Alert 1: High Error Rate**
   - Condition: Error rate > 5% for 5 minutes
   - Actions: Email team, Slack notification
   - Save

3. **Alert 2: Critical Route Failures**
   - Condition: Errors on routes:
     - `/api/webhooks/paddle`
     - `/api/onboarding`
     - `/api/mock/subscribe`
   - Threshold: > 3 errors in 10 minutes
   - Actions: Email team, Slack notification
   - Save

4. **Alert 3: Performance Degradation**
   - Condition: p95 latency > 5s for 10 minutes
   - Actions: Email team
   - Save

### Step 3: Set Up Release Tracking

1. Go to Sentry → Settings → Projects → [Your Project] → Releases
2. Enable release tracking
3. Verify releases are being created on deployments

## Key Metrics to Monitor

### Daily Checks
- Signup count (PostHog)
- Onboarding completion rate (PostHog)
- Error rate (Sentry)
- Checkout success rate (Paddle dashboard)

### Weekly Reviews
- Launch Funnel conversion rates (PostHog)
- Top error types (Sentry)
- Performance trends (Sentry)
- User retention (PostHog)

## Troubleshooting

### Events Not Appearing in PostHog
1. Check browser console for PostHog errors
2. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
3. Check cookie consent (marketing pages)
4. Review PostHog debug logs

### Sentry Not Capturing Errors
1. Verify `SENTRY_DSN` is set
2. Check Sentry initialization in `sentry.client.config.ts`
3. Review Sentry dashboard for connection status
4. Check environment tags are correct

### Alerts Not Firing
1. Verify alert conditions are correct
2. Check notification channels (email/Slack)
3. Test alerts manually
4. Review alert history in PostHog/Sentry

## Launch Day Checklist

- [ ] PostHog Launch Funnel dashboard created
- [ ] PostHog alerts configured
- [ ] Sentry alerts configured
- [ ] Team has access to PostHog dashboard
- [ ] Team has access to Sentry dashboard
- [ ] Notification channels tested (email/Slack)
- [ ] Key metrics baseline documented

