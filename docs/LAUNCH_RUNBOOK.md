# Launch Runbook

This document provides operational procedures for common issues and launch scenarios.

## Critical Flows SLOs

### Signup Flow
- **Target**: 99% success rate
- **Performance**: < 3s page load, < 1s API response
- **Monitoring**: PostHog funnel: `user_signed_up` event

### Onboarding Flow
- **Target**: 80% completion rate (signup → onboarding completed)
- **Performance**: < 5s per step
- **Monitoring**: PostHog funnel: `onboarding_step_completed` → `onboarding_completed`

### First Learning Session
- **Target**: 60% of onboarded users reach first lesson within 24 hours
- **Performance**: < 3s lesson page load
- **Monitoring**: PostHog events: `lesson_viewed`, `lesson_completed`

### Billing Flow
- **Target**: 95% checkout success rate
- **Performance**: Paddle checkout < 10s to open
- **Monitoring**: Paddle webhook events, Sentry errors on `/api/webhooks/paddle`

## Common Issues & Resolutions

### Issue: Billing Failures

**Symptoms:**
- Users report subscription not activating
- Paddle webhook errors in Sentry
- Users redirected to billing page repeatedly

**Diagnosis:**
1. Check Sentry for errors in `/api/webhooks/paddle`
2. Verify Paddle webhook signature validation
3. Check database for subscription records
4. Review Paddle dashboard for failed transactions

**Resolution:**
1. If webhook signature fails: Verify `PADDLE_PUBLIC_KEY` env var
2. If subscription not created: Check idempotency logic (webhook_events table)
3. If user stuck: Manually create subscription via admin or Paddle dashboard
4. If widespread: Check Paddle status page, consider disabling checkout temporarily

**Prevention:**
- Monitor webhook success rate in Sentry
- Set up alerts for webhook failure spikes
- Regular testing of checkout flow

---

### Issue: AI Model Failures

**Symptoms:**
- Debrief generation fails
- AI Study Assistant not responding
- Timeout errors on AI endpoints

**Diagnosis:**
1. Check Sentry for AI-related errors
2. Review token usage in admin dashboard
3. Check AI provider status (OpenAI, Vertex AI)
4. Review rate limiting logs

**Resolution:**
1. If rate limited: Wait for rate limit reset, consider upgrading tier
2. If model unavailable: Switch to fallback model if configured
3. If timeout: Increase timeout, optimize prompts
4. If widespread: Disable AI features temporarily, show maintenance message

**Prevention:**
- Monitor token usage trends
- Set up alerts for AI error rate spikes
- Implement graceful degradation

---

### Issue: Site Performance Degradation

**Symptoms:**
- Slow page loads (> 5s)
- Timeout errors
- High error rates

**Diagnosis:**
1. Check Vercel analytics for performance metrics
2. Review Sentry for timeout errors
3. Check database connection pool status
4. Review CDN cache hit rates

**Resolution:**
1. If database slow: Check connection pool, consider scaling
2. If API slow: Review slow queries, add caching
3. If CDN issues: Check Vercel status, clear cache if needed
4. If widespread: Scale up infrastructure, enable maintenance mode

**Prevention:**
- Monitor Core Web Vitals
- Set up alerts for p95 latency > 3s
- Regular performance audits

---

### Issue: Content Access Errors

**Symptoms:**
- Users see "Access Denied" incorrectly
- Entitlements not working
- Wrong content shown for plan

**Diagnosis:**
1. Check user subscription status in database
2. Verify entitlements logic in `lib/entitlements.ts`
3. Review access logs in Sentry
4. Test with different plan types

**Resolution:**
1. If entitlements wrong: Fix domain-to-year mapping in `lib/entitlements.ts`
2. If subscription not detected: Check subscription table, verify webhook processing
3. If admin access broken: Verify role checks in `lib/auth/authorize.ts`
4. If widespread: Temporarily disable entitlements checks (fail open)

**Prevention:**
- Test entitlements with each plan change
- Monitor access denial rates
- Regular audit of access control logic

---

## Launch Day Checklist

### Pre-Launch (T-1 day)
- [ ] Verify all environment variables set in production:
  - [ ] `NEXT_PUBLIC_PADDLE_VENDOR_ID`
  - [ ] `NEXT_PUBLIC_PADDLE_ENVIRONMENT` (sandbox or production)
  - [ ] `NEXT_PUBLIC_PADDLE_PLAN_EXPLORER`
  - [ ] `NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL`
  - [ ] `NEXT_PUBLIC_PADDLE_PLAN_EXECUTIVE`
  - [ ] `PADDLE_API_KEY`
  - [ ] `PADDLE_PUBLIC_KEY`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Test checkout flow end-to-end with real Paddle account:
  - [ ] Sign up → Onboarding → Choose plan → Complete payment
  - [ ] Verify webhook creates subscription in database
  - [ ] Verify user can access content immediately after payment
  - [ ] Test upgrade flow (Explorer → Professional)
  - [ ] Test downgrade flow (Professional → Explorer)
  - [ ] Test cancellation via billing portal
- [ ] Verify webhook endpoints are accessible (`/api/webhooks/paddle`)
- [ ] Check Sentry is configured and receiving events:
  - [ ] Verify `SENTRY_DSN` is set in production
  - [ ] Test error tracking by triggering a test error
  - [ ] Verify alerts are configured (see `docs/OBSERVABILITY_SETUP.md`)
- [ ] Verify PostHog is tracking events correctly (signup, onboarding, subscription_started):
  - [ ] Verify `NEXT_PUBLIC_POSTHOG_KEY` is set in production
  - [ ] Test event tracking by signing up a test user
  - [ ] Verify Launch Funnel dashboard is created (see `docs/OBSERVABILITY_SETUP.md`)
  - [ ] Verify alerts are configured
- [ ] Test export/deletion flows
- [ ] Review and test all critical user journeys
- [ ] Verify backup/restore procedures
- [ ] Smoke-test entitlements: Verify Explorer can access Year 1, Professional can access Years 1-3, Executive can access all years

### Launch Day (T-0)
- [ ] Monitor Sentry dashboard for errors
- [ ] Watch PostHog for user signups and funnel metrics
- [ ] Monitor Paddle dashboard for checkout activity
- [ ] Check server logs for anomalies
- [ ] Have runbook accessible to team
- [ ] Be ready to disable features if critical issues arise

### Post-Launch (T+1 to T+7)
- [ ] Review first-day metrics (signups, conversions, errors)
- [ ] Address any critical issues from launch day
- [ ] Monitor user feedback channels
- [ ] Review and optimize based on analytics
- [ ] Plan first-week improvements

## Emergency Procedures

### Disable Signups
1. Set `NEXT_PUBLIC_DISABLE_SIGNUP=true` in environment
2. Update signup page to show "Temporarily unavailable" message
3. Monitor existing user activity

### Disable Billing
1. Set `NEXT_PUBLIC_ENABLE_MOCK_CHECKOUT=true` (if needed for testing)
2. Or remove Paddle plan IDs from environment
3. Show "Billing temporarily unavailable" message

### Enable Maintenance Mode
1. Create maintenance page at `/maintenance`
2. Update middleware to redirect all traffic to maintenance page
3. Keep admin routes accessible if needed

### Rollback Deployment
1. Use Vercel deployment rollback feature
2. Or redeploy previous known-good version
3. Verify database migrations are compatible

## Monitoring & Alerts

### Key Metrics to Monitor
- Signup conversion rate
- Onboarding completion rate
- First lesson completion rate
- Checkout success rate
- Error rate (target: < 1%)
- Page load time (target: p95 < 3s)
- API response time (target: p95 < 1s)

### Alert Thresholds
- Error rate > 5% for 5 minutes
- Checkout failure rate > 10%
- Page load time p95 > 5s for 10 minutes
- Database connection errors
- AI service failures > 20%

### Tools
- **Sentry**: Error tracking and performance monitoring
- **PostHog**: User analytics and funnels
- **Vercel Analytics**: Performance metrics
- **Paddle Dashboard**: Billing and subscription metrics

## Support Escalation

1. **Level 1**: Check runbook, common fixes
2. **Level 2**: Review Sentry logs, check database
3. **Level 3**: Engage engineering team
4. **Critical**: Immediate escalation, consider disabling features

## Contact Information

**IMPORTANT**: Fill in all contact information before launch day.

- **Engineering Lead**: [Fill in before launch]
  - Email: [Fill in]
  - Phone/Slack: [Fill in]
  - Availability: [Fill in]

- **DevOps**: [Fill in before launch]
  - Email: [Fill in]
  - Phone/Slack: [Fill in]
  - Availability: [Fill in]

- **Support Team**: support@execemy.com
  - Response time: Within 2 business days (as stated in FAQ)
  - Escalation: For urgent billing issues, escalate to Engineering Lead

- **Paddle Support**: support@paddle.com
  - For Paddle-specific issues (webhook problems, payment processing)

- **Emergency Escalation**: [Fill in before launch]
  - For critical production issues requiring immediate attention
  - Include: Phone number, escalation path, on-call rotation

## Refund & Billing Operations

### 30-Day Evaluation Period Policy

As stated in Terms of Service and pricing pages:
- Users can request a full refund within 30 days of initial subscription
- Refund requests should be sent to support@execemy.com
- Response time: Within 2 business days

### Refund Process

1. **Receive Request**
   - Monitor support@execemy.com for refund requests
   - Verify request is within 30-day window (check subscription `created_at` date)

2. **Process Refund**
   - Log into Paddle Dashboard
   - Navigate to **Transactions** → Find user's transaction
   - Click **Refund** → Select full or partial refund
   - Add refund reason: "30-day evaluation period request"

3. **Update Records**
   - Document refund in internal system (spreadsheet/CRM)
   - Note: Paddle webhook will automatically update subscription status to `canceled`
   - Verify user's subscription is canceled in database

4. **Notify User**
   - Send confirmation email to user
   - Include refund amount and expected processing time (typically 5-10 business days)

### Billing Edge Cases

**User paid but subscription not created:**
1. Check Paddle dashboard for successful transaction
2. Check Sentry for webhook errors
3. Check `webhook_events` table for duplicate/missing events
4. If webhook failed: Manually create subscription via admin panel or Paddle API
5. If user stuck: Contact user, explain delay, manually activate access

**Upgrade/Downgrade Issues:**
1. Verify Paddle processed the change
2. Check webhook received `subscription.updated` event
3. Verify database subscription record updated
4. If not: Manually update subscription in database or trigger webhook retry

**Payment Failures / Past Due:**
1. Automated email sent via webhook (see `app/api/webhooks/paddle/route.ts`)
2. Monitor for `subscription.past_due` events
3. After grace period, subscription will be canceled automatically
4. User access should be revoked when subscription status is `canceled` or `past_due`

### Refund Approval Authority

- **Who can approve**: [Fill in - typically Engineering Lead or Founder]
- **Approval process**: [Fill in - email confirmation, internal log, etc.]
- **Documentation**: All refunds must be logged with:
  - User email
  - Subscription ID
  - Refund amount
  - Refund reason
  - Date processed

