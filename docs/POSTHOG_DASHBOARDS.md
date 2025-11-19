# PostHog Dashboard Setup Guide

This guide outlines the key dashboards and funnels to set up in PostHog for launch monitoring.

## Required Dashboards

### 1. Launch Funnel Dashboard

**Purpose**: Track user journey from first visit to first learning win

**Funnel Steps**:
1. `$pageview` on marketing pages
2. `user_signed_up` event
3. `onboarding_completed` event
4. `lesson_viewed` event (first lesson)
5. `lesson_completed` event (first lesson)
6. `simulation_started` event (first simulation)

**Metrics to Track**:
- Conversion rate at each step
- Drop-off points
- Time between steps
- Cohort analysis (by signup date)

**Alert Thresholds**:
- Signup → Onboarding completion < 50%
- Onboarding → First lesson < 40%
- First lesson → First completion < 30%

---

### 2. Activation & Engagement Dashboard

**Purpose**: Measure user activation and ongoing engagement

**Key Metrics**:
- **Activation Rate**: % of users who complete first lesson within 7 days
- **Engagement Rate**: % of active users (activity in last 7 days)
- **Retention**: Day 1, Day 7, Day 30 retention rates
- **Weekly Active Users (WAU)**
- **Monthly Active Users (MAU)**

**Events to Track**:
- `lesson_viewed`
- `lesson_completed`
- `simulation_started`
- `simulation_completed`
- `debrief_shared`
- `dashboard_card_clicked`

**Cohorts**:
- By signup week
- By plan type (Explorer/Professional/Executive)
- By learning track

---

### 3. Billing & Conversion Dashboard

**Purpose**: Monitor billing health and conversion rates

**Key Metrics**:
- **Checkout Initiated**: Users who click checkout button
- **Checkout Completed**: Successful Paddle transactions
- **Conversion Rate**: Signup → Paid conversion
- **Plan Distribution**: Explorer vs Professional vs Executive
- **Upgrade/Downgrade Rates**

**Events to Track**:
- `subscription_started` (from webhook)
- Custom event: `checkout_initiated` (to be added)
- Custom event: `checkout_completed` (to be added)

**Alerts**:
- Checkout completion rate < 80%
- Subscription failures > 5%

---

### 4. Content Performance Dashboard

**Purpose**: Understand which content drives engagement

**Key Metrics**:
- Most viewed lessons (by domain, module)
- Most completed lessons
- Most started simulations
- Average time to complete lesson
- Drop-off points in lessons

**Events to Track**:
- `lesson_viewed` (with domainId, moduleId, lessonId)
- `lesson_completed` (with domainId, moduleId, lessonId)
- `simulation_started` (with caseId)
- `simulation_completed` (with caseId)

**Insights**:
- Identify high-value content
- Find content that needs improvement
- Understand learning path preferences

---

### 5. Error & Performance Dashboard

**Purpose**: Monitor technical health

**Key Metrics**:
- Error rate by route
- Page load times
- API response times
- Failed webhook deliveries

**Events to Track**:
- Sentry errors (integrated via PostHog-Sentry integration)
- Custom performance events (to be added)

**Alerts**:
- Error rate > 1%
- Page load time p95 > 5s

---

## Setting Up Dashboards in PostHog

### Step 1: Create Funnel

1. Go to PostHog → Insights → New Insight
2. Select "Funnel" type
3. Add steps in order
4. Set date range (e.g., Last 7 days)
5. Save as "Launch Funnel"

### Step 2: Create Dashboard

1. Go to PostHog → Dashboards → New Dashboard
2. Name it (e.g., "Launch Monitoring")
3. Add insights/funnels to dashboard
4. Set refresh interval
5. Share with team

### Step 3: Set Up Alerts

1. Go to PostHog → Alerts → New Alert
2. Select insight/metric
3. Set threshold
4. Configure notification (email, Slack, etc.)

## Key Events Reference

All events are defined in `lib/analytics.ts`:

### User Lifecycle
- `user_signed_up`
- `onboarding_step_completed`
- `onboarding_completed`

### Learning
- `lesson_viewed`
- `lesson_completed`
- `lesson_progress`
- `lesson_bookmarked`

### Simulations
- `simulation_started`
- `simulation_completed`
- `case_study_started`
- `case_study_completed`

### Engagement
- `debrief_shared`
- `dashboard_card_clicked`
- `apply_this_now_clicked`
- `response_liked`

### Billing
- `subscription_started`

## Event Properties

Each event includes relevant properties:

- `userId`: User identifier
- `lessonId`, `domainId`, `moduleId`: For lesson events
- `simulationId`, `caseId`: For simulation events
- `planId`: For subscription events

## Best Practices

1. **Test Events**: Verify events fire correctly in development
2. **Naming Consistency**: Use consistent event names (snake_case)
3. **Property Naming**: Use consistent property names across events
4. **Privacy**: Don't send PII in event properties (use userId only)
5. **Sampling**: Consider sampling for high-volume events if needed

## Troubleshooting

### Events Not Appearing
1. Check PostHog initialization in browser console
2. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
3. Check cookie consent (marketing pages)
4. Review PostHog debug logs

### Funnel Not Working
1. Verify all events are firing
2. Check event property names match
3. Ensure date range includes events
4. Check for typos in event names

### Performance Issues
1. Enable event sampling if needed
2. Review PostHog plan limits
3. Consider batching events
4. Check network requests in browser

## Launch Day Checklist

- [ ] Verify all key events are firing
- [ ] Test funnels with test user
- [ ] Set up alerts for critical metrics
- [ ] Share dashboards with team
- [ ] Document any custom events added
- [ ] Review PostHog plan limits

