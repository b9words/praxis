# UX Flows Validation Checklist

This checklist should be completed manually before launch to verify all critical user journeys work end-to-end.

## Prerequisites

- Production or staging environment with live Paddle integration
- Test email accounts for signup
- Test payment methods (or Paddle sandbox mode)

## Flow 1: New User Signup → Onboarding → Checkout → Dashboard

### Step 1: Homepage → Signup
- [ ] Navigate to `/` (homepage)
- [ ] Click "Sign up" button
- [ ] Verify redirects to `/signup`
- [ ] Verify signup form is visible and functional
- [ ] Verify Terms of Service and Privacy Policy links work

### Step 2: Signup → Email Verification
- [ ] Fill out signup form (username, full name, email, password)
- [ ] Accept Terms of Service checkbox
- [ ] Submit form
- [ ] Verify email confirmation message appears (if email confirmation required)
- [ ] Check email inbox for verification link
- [ ] Click verification link
- [ ] Verify redirects to `/onboarding`

### Step 3: Onboarding Flow
- [ ] **Step 1**: Verify residency selection works
- [ ] **Step 2**: Verify background selection works
- [ ] **Step 3**: Verify goals selection works
- [ ] **Step 4**: Verify competency selection works
- [ ] **Step 5**: Verify plan selection page appears with all three plans
- [ ] Verify plan features are correctly displayed
- [ ] Verify pricing matches expected values ($49/$99/$199)

### Step 4: Checkout Flow
- [ ] Select Explorer plan
- [ ] Click "Select Explorer Plan" button
- [ ] Verify Paddle checkout overlay opens
- [ ] Complete checkout with test payment method
- [ ] Verify redirects to `/dashboard?checkout=success`
- [ ] Verify checkout success banner appears
- [ ] Wait 30-60 seconds
- [ ] Verify subscription activates (banner disappears, content accessible)

### Step 5: Content Access
- [ ] Verify dashboard loads correctly
- [ ] Navigate to `/library/curriculum`
- [ ] Verify Year 1 content is accessible
- [ ] Verify Year 2+ content shows upgrade prompt (for Explorer plan)
- [ ] Click on a Year 1 lesson
- [ ] Verify lesson loads and is accessible

## Flow 2: Pricing Page → Signup → Checkout

### Step 1: Pricing Page (Logged Out)
- [ ] Navigate to `/pricing`
- [ ] Verify all three plans are displayed
- [ ] Verify pricing and features are correct
- [ ] Click "Start Explorer" (or any plan) while logged out
- [ ] Verify redirects to `/signup`
- [ ] Complete signup flow
- [ ] Verify redirects to onboarding

### Step 2: Pricing Page (Logged In, No Subscription)
- [ ] Log in as user without subscription
- [ ] Navigate to `/pricing`
- [ ] Verify plans are displayed
- [ ] Click "Start {Plan}" button
- [ ] Verify Paddle checkout opens
- [ ] Complete checkout
- [ ] Verify redirects appropriately

### Step 3: Pricing Page (Logged In, With Subscription)
- [ ] Log in as user with active subscription
- [ ] Navigate to `/pricing`
- [ ] Verify redirects to `/profile/billing`
- [ ] Verify current plan is displayed
- [ ] Verify upgrade/downgrade options are available

## Flow 3: Billing Management

### Step 1: View Current Subscription
- [ ] Log in as user with active subscription
- [ ] Navigate to `/profile/billing`
- [ ] Verify current plan name is displayed
- [ ] Verify plan price is displayed
- [ ] Verify renewal date is displayed
- [ ] Verify "Manage Billing" button is present

### Step 2: Upgrade Subscription
- [ ] On billing page, click "Upgrade to Professional" (or Executive)
- [ ] Verify Paddle checkout opens
- [ ] Complete checkout
- [ ] Verify redirects back to `/profile/billing?checkout=success`
- [ ] Verify checkout success banner appears
- [ ] Wait for webhook processing
- [ ] Verify subscription updated in database
- [ ] Verify user can now access upgraded content

### Step 3: Downgrade Subscription
- [ ] On billing page, click "Downgrade to Explorer"
- [ ] Verify Paddle checkout opens
- [ ] Complete checkout
- [ ] Verify subscription updated
- [ ] Verify user loses access to higher-tier content

### Step 4: Cancel Subscription
- [ ] Click "Manage Billing" button
- [ ] Verify redirects to Paddle customer portal
- [ ] Cancel subscription in Paddle portal
- [ ] Return to app
- [ ] Verify subscription status updated to `canceled`
- [ ] Verify user loses access to content

## Flow 4: Content Access & Entitlements

### Explorer Plan
- [ ] Log in as Explorer subscriber
- [ ] Verify can access Year 1 domains:
  - [ ] `second-order-decision-making`
  - [ ] `organizational-design-talent-density`
- [ ] Verify cannot access Year 2+ domains (shows upgrade prompt)
- [ ] Verify can access simulations
- [ ] Verify cannot access advanced features

### Professional Plan
- [ ] Log in as Professional subscriber
- [ ] Verify can access Years 1-3 domains
- [ ] Verify cannot access Year 4+ domains (shows upgrade prompt)
- [ ] Verify can access simulations
- [ ] Verify can access advanced features

### Executive Plan
- [ ] Log in as Executive subscriber
- [ ] Verify can access all years (1-5)
- [ ] Verify can access all domains
- [ ] Verify can access simulations
- [ ] Verify can access all features

## Flow 5: Error Handling & Edge Cases

### Checkout Success but No Subscription
- [ ] Complete checkout
- [ ] If webhook is slow/fails, verify checkout success banner appears
- [ ] Verify banner message is helpful
- [ ] Verify banner auto-checks subscription status
- [ ] Verify banner can be dismissed

### Payment Failure
- [ ] Attempt checkout with failing payment method
- [ ] Verify appropriate error message
- [ ] Verify user can retry checkout

### Access Denied Scenarios
- [ ] Log in as non-subscriber
- [ ] Navigate to protected content
- [ ] Verify upgrade prompt appears
- [ ] Verify redirect to billing page works

### Upgrade Prompt Accuracy
- [ ] Explorer user tries to access Year 2 content
- [ ] Verify upgrade prompt mentions "Professional" plan
- [ ] Explorer user tries to access Year 5 content
- [ ] Verify upgrade prompt mentions "Executive" plan

## Flow 6: Mobile Responsiveness

Test all critical flows on mobile devices:

- [ ] Homepage is readable and functional
- [ ] Signup form is usable
- [ ] Onboarding steps are navigable
- [ ] Pricing page displays correctly
- [ ] Billing page is functional
- [ ] Paddle checkout overlay works on mobile
- [ ] Dashboard is usable

## Flow 7: Accessibility

- [ ] Keyboard navigation works for all primary CTAs
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader can navigate critical flows
- [ ] Form labels are properly associated

## Issues Found

Document any issues discovered during testing:

1. [Issue description]
   - Steps to reproduce:
   - Expected behavior:
   - Actual behavior:
   - Severity: [Critical/High/Medium/Low]

## Sign-Off

- [ ] All critical flows tested
- [ ] All issues documented
- [ ] Critical issues resolved
- [ ] Ready for launch

**Tester**: _________________  
**Date**: _________________  
**Environment**: _________________

