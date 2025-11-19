# Data Retention Policy

This document outlines data retention policies and cleanup procedures for the Execemy platform.

## Retention Periods

### User Data
- **Active Users**: Retained indefinitely while account is active
- **Inactive Users**: Retained for 3 years after last activity
- **Deleted Users**: Data anonymized/deleted after 30 days grace period

### Analytics Data
- **PostHog Events**: Retained for 2 years
- **Sentry Events**: Retained for 90 days
- **Server Logs**: Retained for 30 days

### AI-Generated Content
- **Debriefs**: Retained for 5 years (for user reference)
- **AI Study Assistant Logs**: Retained for 90 days
- **Token Usage Records**: Retained for 1 year (for cost analysis)

### Content & Learning Data
- **Lesson Progress**: Retained indefinitely (core user value)
- **Simulation Attempts**: Retained for 5 years
- **Case Responses**: Retained indefinitely (community value)

### Billing Data
- **Subscription Records**: Retained for 7 years (legal requirement)
- **Payment Transactions**: Handled by Paddle (their retention policy applies)
- **Invoice Data**: Retained for 7 years

## Cleanup Jobs

### Automated Cleanup (To Be Implemented)

Create a scheduled job (e.g., Vercel Cron or Supabase Edge Function) to run monthly:

```typescript
// scripts/cleanup-old-data.ts
// Run monthly to clean up old data per retention policy

async function cleanupOldData() {
  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
  
  // Find inactive users (no activity in 3 years)
  const inactiveUsers = await prisma.profile.findMany({
    where: {
      updatedAt: { lt: threeYearsAgo },
      // No recent simulations, progress, or logins
    },
  })
  
  // Anonymize or delete based on policy
  // ...
}
```

### Manual Cleanup Procedures

#### Anonymize User Data
1. Remove PII (email, name, bio)
2. Replace with generic identifiers
3. Keep learning progress for analytics
4. Update audit logs

#### Delete User Data (GDPR Right to Erasure)
1. Delete from all tables (cascade deletes configured)
2. Delete from Supabase Auth
3. Delete from storage (avatars, exports)
4. Log deletion in audit log

## GDPR Compliance

### Right to Access (Data Export)
- Implemented: `/api/profile/settings/privacy/export`
- Returns all user data in JSON format
- Includes: profile, progress, simulations, debriefs, subscriptions

### Right to Erasure (Data Deletion)
- **Implemented**: `/api/profile/settings/privacy/delete` (DELETE method)
- Deletes all user data across all systems:
  - Profile and related records (cascade deletes)
  - Progress, simulations, debriefs
  - Supabase Auth account
  - Logs deletion in audit log
- **For v1**: Support-triggered only (no self-service UI)
- **Support Process**:
  1. Verify user identity (email confirmation)
  2. Call DELETE `/api/profile/settings/privacy/delete` with user's auth token
  3. Confirm deletion success
  4. Respond to user within 2 business days

### Right to Rectification
- Users can update profile data via `/profile/edit`
- Changes logged in audit log

## Data Backup

### Automated Backups
- **Database**: Daily backups via Supabase (retained for 30 days)
- **Storage**: Daily backups via Supabase Storage
- **Code**: Version controlled in Git

### Backup Restoration
1. Contact Supabase support for database restore
2. Verify data integrity after restore
3. Test critical flows

## Security & Privacy

### Data Encryption
- **At Rest**: Encrypted by Supabase/PostgreSQL
- **In Transit**: TLS/HTTPS for all connections
- **Sensitive Fields**: Consider additional encryption for PII

### Access Controls
- **Database**: Row-level security (RLS) enabled
- **Storage**: Private buckets with signed URLs
- **Admin Access**: Role-based, logged in audit log

## Compliance Notes

- **GDPR**: EU users have additional rights (see GDPR section)
- **CCPA**: California users can request data deletion
- **COPPA**: Platform is for adults (18+), no COPPA compliance needed

## Implementation Status

- ✅ Data export implemented
- ⏳ Data deletion endpoint (to be implemented)
- ⏳ Automated cleanup jobs (to be implemented)
- ✅ Audit logging for admin actions
- ✅ Cookie consent for analytics

## Future Improvements

1. Implement automated cleanup jobs
2. Add data deletion endpoint
3. Add data retention dashboard in admin
4. Implement data anonymization for analytics
5. Add user data download in admin panel

