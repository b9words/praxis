# Email Triggers: Edge Function Migration Guide

## Current State: Next.js API Route

As of now, automated email triggers are handled by the Next.js API route at `/api/webhooks/db-trigger`. This is simpler for testing and development, but for production resilience, you should migrate to Supabase Edge Functions.

## Why Migrate to Edge Functions?

### Benefits

1. **Independence from Next.js App State**
   - Edge Functions run in Supabase infrastructure, separate from your Next.js app
   - If your Next.js app is down, redeploying, or experiencing issues, emails still send
   - Critical for transactional emails (welcome, domain completion)

2. **Better Security Boundary**
   - Service role key stays in Supabase infrastructure
   - No need to expose sensitive keys in Next.js runtime environment
   - Edge Functions have their own isolated secrets management

3. **Lower Latency**
   - Runs closer to the database (same Supabase infrastructure)
   - No network hop to your Next.js server
   - Faster response times for webhook processing

4. **Scalability**
   - Edge Functions scale independently
   - Don't consume Next.js server resources
   - Better for high-volume webhook traffic

5. **Operational Resilience**
   - Database events trigger emails even if your app is:
     - Undergoing maintenance
     - Experiencing cold starts
     - Rate limited
     - In a deployment state

## Migration Steps

### 1. Environment Variable Mapping

**Current (Next.js):**
```env
WEBHOOK_SECRET=your-secret-here
SUPABASE_SERVICE_ROLE_KEY=your-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
RESEND_API_KEY=your-key
RESEND_FROM_EMAIL=noreply@execemy.com
NEXT_PUBLIC_APP_URL=https://execemy.com
```

**After Migration (Edge Function Secrets):**
```bash
# Set via Supabase CLI or Dashboard
supabase secrets set EDGE_WEBHOOK_SECRET=your-secret-here  # Same as WEBHOOK_SECRET
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
supabase secrets set RESEND_API_KEY=your-key
supabase secrets set RESEND_FROM_EMAIL=noreply@execemy.com
supabase secrets set NEXT_PUBLIC_APP_URL=https://execemy.com
```

### 2. Update Webhook Configuration

**Current (Next.js API):**
- URL: `https://your-app.com/api/webhooks/db-trigger`
- Header: `Authorization: Bearer ${WEBHOOK_SECRET}`

**After Migration (Edge Function):**
- URL: `https://your-project.supabase.co/functions/v1/handle-db-trigger`
- Header: `Authorization: Bearer ${EDGE_WEBHOOK_SECRET}`

**Steps:**
1. Go to Supabase Dashboard → Database → Webhooks
2. Edit the `domain_completions` webhook
3. Update URL to: `https://your-project.supabase.co/functions/v1/handle-db-trigger`
4. Update Authorization header to use `EDGE_WEBHOOK_SECRET` value
5. Save

### 3. Deploy Edge Function

```bash
# Deploy the existing edge function
supabase functions deploy handle-db-trigger

# Verify deployment
supabase functions list
```

### 4. Verify Edge Function Secrets

Ensure all secrets are set:
```bash
supabase secrets list
```

Required secrets:
- `EDGE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`

### 5. Test the Migration

1. **Test Domain Completion:**
   ```sql
   -- Insert a test domain completion
   INSERT INTO domain_completions (user_id, domain_id)
   VALUES ('test-user-id', 'test-domain');
   ```
   Verify email is sent.

2. **Check Edge Function Logs:**
   ```bash
   supabase functions logs handle-db-trigger --tail
   ```

3. **Monitor for Errors:**
   - Check Supabase Dashboard → Edge Functions → Logs
   - Verify no 401/500 errors
   - Confirm emails are being sent

### 6. Clean Up (Optional)

After confirming Edge Function works:
- Keep `/api/webhooks/db-trigger` route as backup (commented or disabled)
- Or remove it if you're confident in Edge Function
- Keep `WEBHOOK_SECRET` in Next.js env for potential rollback

## Code Differences

The Edge Function (`supabase/functions/handle-db-trigger/index.ts`) and Next.js route (`app/api/webhooks/db-trigger/route.ts`) have minimal differences:

### Similarities
- Same payload parsing logic
- Same handler functions (`handleNewUser`, `handleDomainCompletion`)
- Same email template logic
- Same security checks

### Differences

**Edge Function:**
- Uses `Deno.env.get()` for environment variables
- Uses inline HTML email generation (simpler templates)
- Runs in Deno runtime

**Next.js Route:**
- Uses `process.env.*` for environment variables
- Uses `lib/email` utilities and React Email templates
- Runs in Node.js runtime
- Can use Prisma directly

## Rollback Plan

If Edge Functions cause issues, rollback is simple:

1. **Revert Webhook URL:**
   - Change webhook URL back to: `https://your-app.com/api/webhooks/db-trigger`
   - Update header to use `WEBHOOK_SECRET`

2. **No Code Changes Needed:**
   - Next.js route is already implemented
   - Just point webhook back to it

3. **Monitor:**
   - Check that emails resume sending
   - Verify no duplicate sends

## Migration Checklist

- [ ] Set all Edge Function secrets via Supabase CLI/Dashboard
- [ ] Deploy Edge Function: `supabase functions deploy handle-db-trigger`
- [ ] Update Supabase Database Webhook URL to Edge Function
- [ ] Update Webhook Authorization header to use `EDGE_WEBHOOK_SECRET`
- [ ] Test domain_completion webhook with real insert
- [ ] Verify email is sent successfully
- [ ] Check Edge Function logs for errors
- [ ] Monitor for 24-48 hours to ensure stability
- [ ] (Optional) Remove Next.js route after confirming stability

## Notes

- The Edge Function code is already in `supabase/functions/handle-db-trigger/index.ts`
- No code changes needed - just configuration updates
- Both implementations are functionally equivalent
- Edge Function is recommended for production for resilience






