# Paddle Configuration Guide

This document outlines the steps required to configure Paddle for production self-serve launch.

## Prerequisites

- Paddle account with production access
- Access to production environment variables
- Webhook endpoint accessible from Paddle's servers

## Step 1: Create Products in Paddle

1. Log into Paddle Dashboard: https://vendors.paddle.com
2. Navigate to **Products** → **Create Product**
3. Create three subscription products matching your plans:

### Explorer Plan
- **Name**: Explorer
- **Type**: Subscription
- **Billing Cycle**: Monthly
- **Price**: $49/month
- **Note the Price ID** (format: `pri_01...`) - this will be used in `NEXT_PUBLIC_PADDLE_PLAN_EXPLORER`

### Professional Plan
- **Name**: Professional
- **Type**: Subscription
- **Billing Cycle**: Monthly
- **Price**: $99/month
- **Note the Price ID** (format: `pri_01...`) - this will be used in `NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL`

### Executive Plan
- **Name**: Executive
- **Type**: Subscription
- **Billing Cycle**: Monthly
- **Price**: $199/month
- **Note the Price ID** (format: `pri_01...`) - this will be used in `NEXT_PUBLIC_PADDLE_PLAN_EXECUTIVE`

### Optional: Annual Plans
If offering annual billing (mentioned in pricing page):
- Create annual variants of each plan with 20% discount
- Note: Current implementation uses monthly plans only. Annual plans would require additional implementation.

## Step 2: Configure Environment Variables

Set the following environment variables in your production environment (Vercel, etc.):

```bash
# Paddle Vendor ID (found in Paddle Dashboard → Settings → Account)
NEXT_PUBLIC_PADDLE_VENDOR_ID=your_vendor_id

# Paddle Environment (use 'production' for live, 'sandbox' for testing)
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production

# Plan Price IDs (from Step 1)
NEXT_PUBLIC_PADDLE_PLAN_EXPLORER=pri_01...
NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL=pri_01...
NEXT_PUBLIC_PADDLE_PLAN_EXECUTIVE=pri_01...

# Paddle API Keys (found in Paddle Dashboard → Developer Tools → Authentication)
PADDLE_API_KEY=your_api_key
PADDLE_PUBLIC_KEY=your_public_key
```

**Important**: 
- `PADDLE_PUBLIC_KEY` is used for webhook signature verification
- `PADDLE_API_KEY` is used for server-side Paddle API calls (if needed)
- Never commit these keys to version control

## Step 3: Configure Webhook Endpoint

1. In Paddle Dashboard, navigate to **Developer Tools** → **Notifications**
2. Click **Add Notification**
3. Configure the webhook:
   - **URL**: `https://yourdomain.com/api/webhooks/paddle`
   - **Events to subscribe to**:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `subscription.paused`
     - `subscription.past_due`
     - `transaction.completed`
4. Save the webhook configuration

**Verification**:
- Paddle will send a test webhook to verify the endpoint
- Check your server logs to ensure the webhook is received
- Verify webhook signature validation is working (check Sentry for errors)

## Step 4: Verify Database Schema

Ensure the following tables exist in your database:

1. **`subscriptions`** table (Prisma schema):
   - `id` (UUID, primary key)
   - `user_id` (UUID, unique, foreign key to profiles)
   - `paddle_subscription_id` (String, unique)
   - `paddle_plan_id` (String)
   - `status` (String)
   - `current_period_start` (DateTime)
   - `current_period_end` (DateTime)
   - `created_at` (DateTime)
   - `updated_at` (DateTime)

2. **`webhook_events`** table (Supabase):
   - Used for idempotency (prevents duplicate webhook processing)
   - Should have `event_id` column for deduplication

## Step 5: Test Checkout Flow

### Test Checklist

- [ ] **New Subscription (Explorer)**
  1. Sign up as new user
  2. Complete onboarding
  3. Select Explorer plan in Step 5
  4. Complete Paddle checkout
  5. Verify webhook creates subscription in database
  6. Verify user can access Year 1 content immediately

- [ ] **New Subscription (Professional)**
  1. Repeat above with Professional plan
  2. Verify user can access Years 1-3 content

- [ ] **New Subscription (Executive)**
  1. Repeat above with Executive plan
  2. Verify user can access all years (1-5)

- [ ] **Upgrade Flow**
  1. User with Explorer subscription
  2. Navigate to `/profile/billing`
  3. Click "Upgrade to Professional"
  4. Complete checkout
  5. Verify subscription updated in database
  6. Verify user can now access Years 1-3

- [ ] **Downgrade Flow**
  1. User with Professional subscription
  2. Navigate to `/profile/billing`
  3. Click "Downgrade to Explorer"
  4. Complete checkout
  5. Verify subscription updated
  6. Verify user loses access to Years 2-3

- [ ] **Cancellation Flow**
  1. User with active subscription
  2. Navigate to `/profile/billing`
  3. Click "Manage Billing" (opens Paddle portal)
  4. Cancel subscription in Paddle
  5. Verify `subscription.canceled` webhook received
  6. Verify subscription status updated to `canceled` in database

- [ ] **Payment Failure**
  1. Use test card that will fail: `4000 0000 0000 0002`
  2. Attempt checkout
  3. Verify appropriate error handling

- [ ] **Past Due Handling**
  1. Simulate past due subscription (via Paddle test mode or manual DB update)
  2. Verify `subscription.past_due` webhook received
  3. Verify past due email sent to user
  4. Verify user access is maintained until subscription fully canceled

## Step 6: Verify Webhook Processing

### Check Webhook Logs

1. Monitor Sentry for errors in `/api/webhooks/paddle`
2. Check database `webhook_events` table for processed events
3. Verify idempotency: resend same webhook event, should return `{ received: true, duplicate: true }`

### Common Webhook Issues

**Issue**: Webhook signature validation fails
- **Solution**: Verify `PADDLE_PUBLIC_KEY` matches the public key in Paddle Dashboard

**Issue**: User not found for subscription
- **Solution**: Ensure user is authenticated during checkout (passthrough contains `userId`)

**Issue**: Subscription not created in database
- **Solution**: Check webhook logs, verify Prisma connection, check for database errors

## Step 7: Production Readiness Checklist

Before going live:

- [ ] All three plan price IDs configured in production environment
- [ ] `NEXT_PUBLIC_PADDLE_ENVIRONMENT=production` (not sandbox)
- [ ] Webhook endpoint accessible from public internet
- [ ] Webhook signature verification working
- [ ] All test flows completed successfully
- [ ] Monitoring/alerts configured for webhook failures
- [ ] Support team has access to Paddle dashboard
- [ ] Refund process documented (see `docs/LAUNCH_RUNBOOK.md`)

## Troubleshooting

### Subscription Not Activating After Payment

1. Check Paddle dashboard for successful transaction
2. Check Sentry for webhook errors
3. Check database `subscriptions` table for record
4. Check `webhook_events` table for duplicate events
5. Manually trigger webhook retry from Paddle dashboard if needed

### User Stuck in Checkout Loop

1. Verify user has active subscription in database
2. Check entitlements logic in `lib/entitlements.ts`
3. Clear browser cache/cookies
4. Check for JavaScript errors in browser console

### Webhook Not Receiving Events

1. Verify webhook URL is correct and accessible
2. Check Paddle dashboard → Notifications for webhook status
3. Verify firewall/security rules allow Paddle IPs
4. Check server logs for incoming requests

## Support Resources

- **Paddle Documentation**: https://developer.paddle.com
- **Paddle Support**: support@paddle.com
- **Paddle Status Page**: https://status.paddle.com

