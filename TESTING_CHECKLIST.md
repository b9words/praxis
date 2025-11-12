# End-to-End Testing Checklist

This document provides a quick smoke test checklist for validating the platform after seeding test data.

## Prerequisites

1. **Seed Test Data**: Run the seed endpoint to populate initial data
   ```bash
   # Via API (dev only)
   POST /api/dev/seed
   # Or call seedComprehensiveData(userId) programmatically
   ```

2. **Environment Setup**: Ensure `NEXT_PUBLIC_DISABLE_SOFT_PAYWALL=true` is set in `.env.local` for testing

## Smoke Test Paths

### 1. Dashboard & Progress
- [ ] Login and navigate to Dashboard
- [ ] Verify seeded progress is visible (completed lessons, simulations)
- [ ] Check notifications are displayed
- [ ] Verify progress statistics are accurate

### 2. Case Studies - Overview
- [ ] Navigate to Library → Case Studies
- [ ] Open `cs_unit_economics_crisis` (or any case study)
- [ ] Verify overview page loads without errors
- [ ] Check that prerequisites banner shows (if applicable)
- [ ] Verify case materials section displays correctly
- [ ] **Community responses should NOT be visible** (case not completed yet)

### 3. Case Studies - Tasks/Workspace
- [ ] Click "Start Case Study" or "Continue Case Study"
- [ ] Verify tasks page loads without errors
- [ ] Make a decision/complete a stage
- [ ] Verify state saves correctly (no "Simulation not available" errors)
- [ ] Complete the case study
- [ ] Verify debrief is generated or retrieved
- [ ] Check that completion status updates

### 4. Case Studies - Community Responses
- [ ] After completing a case, return to overview page
- [ ] **Community responses should NOW be visible**
- [ ] Verify responses display correctly
- [ ] Test liking a response (if logged in)
- [ ] Check that response content renders properly

### 5. Curriculum/Lessons
- [ ] Navigate to Library → Curriculum
- [ ] Open first lesson in any domain
- [ ] Verify lesson content loads
- [ ] Check that first 5 lessons show as "completed" (from seed)
- [ ] Verify lesson progress tracking works

### 6. Admin Content
- [ ] Navigate to Admin → Content
- [ ] Verify page loads without 500 errors
- [ ] Check that articles and cases are listed
- [ ] Verify filters work (search, status, competency)
- [ ] Test pagination if there are many items

## Common Issues to Watch For

1. **"Simulation not available" errors**: Should not occur after unification
2. **"Cannot read properties of null" errors**: Should be fixed with null guards
3. **500 errors on admin/content**: Should return empty results gracefully
4. **Community responses visible before completion**: Should be hidden until case is completed
5. **Missing data**: Run seed endpoint to populate test data

## Quick Fixes

- **No simulations**: Run `/api/dev/seed` endpoint
- **Admin 500 errors**: Check database connection and Prisma schema
- **Missing community responses**: Complete a case study first, then check overview page
- **Soft paywall blocking**: Set `NEXT_PUBLIC_DISABLE_SOFT_PAYWALL=true` in `.env.local`

## Notes

- JSON cases (like `cs_unit_economics_crisis`) are now automatically imported to DB on first access
- All cases should have database records and simulations after unification
- Community responses only show after case completion
- Seed data includes: competencies, cases, articles, simulations, debriefs, lesson progress, and community responses

