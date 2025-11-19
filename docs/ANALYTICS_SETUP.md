# Analytics & Observability Setup Guide

This guide provides step-by-step instructions for setting up PostHog and Sentry dashboards, funnels, and alerts for launch monitoring.

## PostHog Setup

### Prerequisites
- PostHog account with project access
- `NEXT_PUBLIC_POSTHOG_KEY` environment variable set in production

### Step 1: Verify Event Tracking

Before creating dashboards, verify that events are being tracked:

1. Navigate to your production site
2. Open browser DevTools → Network tab
3. Filter for `posthog` requests
4. Perform actions:
   - Sign up a test user
   - Complete onboarding
   - View a lesson
   - Complete checkout
5. Verify events appear in PostHog → Events

**Key Events to Verify:**
- `$pageview` (automatic)
- `user_signed_up`
- `onboarding_step_completed`
- `onboarding_completed`
- `lesson_viewed`
- `lesson_completed`
- `subscription_started`

### Step 2: Create Launch Funnel

1. Go to PostHog → **Insights** → **New Insight**
2. Select **Funnel** type
3. Configure funnel steps:

   **Step 1: Landing**
   - Event: `$pageview`
   - Filter: `pathname` contains `/pricing` OR `/signup`
   - Label: "Visited Pricing/Signup"

   **Step 2: Signup**
   - Event: `user_signed_up`
   - Label: "Signed Up"

   **Step 3: Onboarding Started**
   - Event: `onboarding_step_completed`
   - Filter: `step` equals `1`
   - Label: "Started Onboarding"

   **Step 4: Onboarding Completed**
   - Event: `onboarding_completed`
   - Label: "Completed Onboarding"

   **Step 5: First Lesson**
   - Event: `lesson_viewed`
   - Label: "Viewed First Lesson"

   **Step 6: Subscription**
   - Event: `subscription_started`
   - Label: "Started Subscription"

4. Set date range: **Last 7 days**
5. Save as: **"Launch Funnel"**

### Step 3: Create Launch Dashboard

1. Go to PostHog → **Dashboards** → **New Dashboard**
2. Name: **"Launch Monitoring"**
3. Add insights:

   **Insight 1: Launch Funnel**
   - Add the funnel created in Step 2
   - Display as: Funnel chart

   **Insight 2: Signups (Last 7 Days)**
   - Type: Trends
   - Event: `user_signed_up`
   - Chart type: Line chart
   - Date range: Last 7 days

   **Insight 3: Onboarding Completion Rate**
   - Type: Trends
   - Formula: `onboarding_completed` / `user_signed_up`
   - Chart type: Line chart
   - Date range: Last 7 days

   **Insight 4: Subscription Starts**
   - Type: Trends
   - Event: `subscription_started`
   - Group by: `planId` (if available)
   - Chart type: Bar chart
   - Date range: Last 7 days

   **Insight 5: Checkout Success Rate**
   - Type: Trends
   - Formula: `subscription_started` / `onboarding_completed`
   - Chart type: Line chart
   - Date range: Last 7 days

4. Set refresh interval: **1 hour**
5. Share dashboard with team members

### Step 4: Configure Alerts

1. Go to PostHog → **Alerts** → **New Alert**

   **Alert 1: Low Onboarding Completion**
   - Insight: Launch Funnel
   - Condition: Conversion rate from "Signed Up" to "Completed Onboarding" < 30%
   - Frequency: Once per day
   - Notification: Email + Slack (if configured)

   **Alert 2: Drop in Signups**
   - Insight: Signups (Last 7 Days)
   - Condition: Count drops > 50% week-over-week
   - Frequency: Once per day
   - Notification: Email

   **Alert 3: Low Checkout Conversion**
   - Insight: Checkout Success Rate
   - Condition: Rate < 20%
   - Frequency: Once per day
   - Notification: Email + Slack

2. Save all alerts

## Sentry Setup

### Prerequisites
- Sentry account with project access
- `SENTRY_DSN` environment variable set in production
- Sentry SDK initialized (see `sentry.client.config.ts` and `sentry.server.config.ts`)

### Step 1: Verify Error Tracking

1. Navigate to Sentry → **Issues**
2. Trigger a test error (or wait for real errors)
3. Verify errors appear in Sentry dashboard
4. Check that environment tags are correct (`production`, `development`)

### Step 2: Create Alert Rules

1. Go to Sentry → **Alerts** → **Create Alert Rule**

   **Alert 1: High Error Rate**
   - Name: "High Error Rate"
   - Condition: Error rate > 5% for 5 minutes
   - Actions:
     - Send email to team
     - Send Slack notification (if configured)
   - Save

   **Alert 2: Critical Route Failures**
   - Name: "Critical Route Failures"
   - Condition: Errors on routes:
     - `/api/webhooks/paddle`
     - `/api/onboarding`
     - `/api/subscribe`
   - Threshold: > 3 errors in 10 minutes
   - Actions:
     - Send email to team
     - Send Slack notification
     - Tag as "critical"
   - Save

   **Alert 3: Webhook Failures**
   - Name: "Paddle Webhook Failures"
   - Condition: Errors containing "paddle" OR route equals `/api/webhooks/paddle`
   - Threshold: > 1 error in 5 minutes
   - Actions:
     - Send email to Engineering Lead
     - Send Slack notification
   - Save

   **Alert 4: Performance Degradation**
   - Name: "Performance Degradation"
   - Condition: p95 latency > 5s for 10 minutes
   - Actions:
     - Send email to team
   - Save

### Step 3: Set Up Release Tracking

1. Go to Sentry → **Settings** → **Projects** → **[Your Project]** → **Releases**
2. Enable release tracking
3. Verify releases are created on deployments (check Vercel integration or manual releases)

### Step 4: Create Performance Dashboard

1. Go to Sentry → **Performance** → **Dashboards** → **New Dashboard**
2. Name: **"Launch Performance"**
3. Add widgets:

   **Widget 1: Error Rate**
   - Type: Error rate
   - Time range: Last 24 hours

   **Widget 2: Top Errors**
   - Type: Top errors
   - Time range: Last 24 hours

   **Widget 3: Webhook Performance**
   - Type: Transaction summary
   - Filter: Transaction contains "webhook"
   - Time range: Last 24 hours

   **Widget 4: API Response Times**
   - Type: Transaction summary
   - Filter: Transaction starts with "/api/"
   - Time range: Last 24 hours

4. Save dashboard

## Monitoring Checklist

Before launch, verify:

- [ ] PostHog events are tracking correctly
- [ ] Launch Funnel dashboard created
- [ ] PostHog alerts configured and tested
- [ ] Sentry errors are being captured
- [ ] Sentry alerts configured and tested
- [ ] Team has access to both dashboards
- [ ] Notification channels (email/Slack) tested
- [ ] Baseline metrics documented

## Daily Monitoring Routine

### Morning Check (First Week)
1. Review PostHog Launch Funnel
2. Check signup count vs. previous day
3. Review Sentry for new errors
4. Check checkout success rate

### Weekly Review
1. Analyze funnel conversion rates
2. Review top error types in Sentry
3. Check performance trends
4. Review user feedback

## Troubleshooting

### PostHog Events Not Appearing
1. Check browser console for PostHog errors
2. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set correctly
3. Check cookie consent (if required on marketing pages)
4. Review PostHog project settings

### Sentry Not Capturing Errors
1. Verify `SENTRY_DSN` is set correctly
2. Check Sentry initialization in client/server configs
3. Review Sentry dashboard for connection status
4. Verify environment tags are correct

### Alerts Not Firing
1. Verify alert conditions are correct
2. Check notification channels (email/Slack) are configured
3. Test alerts manually
4. Review alert history in PostHog/Sentry

## Key Metrics Targets

Based on `docs/LAUNCH_RUNBOOK.md`:

- **Signup Flow**: 99% success rate
- **Onboarding Flow**: 80% completion rate
- **First Learning Session**: 60% of onboarded users within 24 hours
- **Billing Flow**: 95% checkout success rate
- **Error Rate**: < 1%
- **Page Load Time**: p95 < 3s
- **API Response Time**: p95 < 1s

## Support Resources

- **PostHog Docs**: https://posthog.com/docs
- **Sentry Docs**: https://docs.sentry.io
- **Vercel Analytics**: https://vercel.com/docs/analytics

