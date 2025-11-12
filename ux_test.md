# Execemy UX Manual Test Plan

This checklist validates the “desktop-first, user-centric” UX improvements end-to-end. Follow steps in order on a desktop viewport (~1280px+).

## 0) Pre-flight
- Sign in with a test user.
- Set Profile bio to include a weekly time goal, e.g. “Weekly commitment: 5 hours”.
- Ensure there’s at least 1 completed lesson from prior days (for streak checks), and at least 1 case study with community responses.

## 1) Dashboard
- Open /dashboard
- Validate “Continue Learning” shows the most recent in-progress item with proper type label (Article/Case Study) and % complete (if applicable).
- Validate “Recommended Next” shows up to 3 items with clear reasons.
- Validate Weekly Goal:
  - Card shows: currentHours / targetHours; the bar width reflects progress% (clamped <= 100%).
  - Trigger a small lesson progress update (see Section 5). Reload dashboard; currentHours increases appropriately (rounded to 0.1h).
  - Edge: If bio contains no time commitment, default target is 2 hours.
- Validate Streak:
  - If you have activity on consecutive days, “Learning Streak” shows the correct number of days (today’s activity counts for today).
  - Edge: If no activity, streak card may not appear.

## 2) Lesson Reader UX (Desktop)
- Open any lesson at /library/curriculum/[domain]/[module]/[lesson]
- Validate:
  - Header shows read time and, if started, % complete. A 1px progress bar appears when > 0%.
  - Two-column layout: primary content left, right rail with sticky Table of Contents (TOC) and Recommendations.
  - Recommendations show up to 3 with clear titles and reasons.
  - CTA near end suggests applying in a Case Study (if applicable).
- Table of Contents:
  - Scrolling content highlights TOC sections (as anchors, per rendering).
- Inline Checks (if present):
  - Selecting answers and submitting shows correct/incorrect states and “Try Again.”
- Keyboard Shortcuts:
  - Press “?” shows a shortcuts overlay.
  - “n” navigates to the next lesson (if available), “p” to previous (if available).
- Progress:
  - Scroll/read a bit; Section 5 will confirm analytics/progress saves.

## 3) Case Study Workspace
- Open a case at /library/case-studies/[caseId] (or the case path in your project).
- Validate layout:
  - Left: stepper shows Tasks progress, only current/past steps clickable.
  - Middle: files/data explorer.
  - Right: Decision Workspace with prompt, options, rubric/examples on right rail.
- Autosave:
  - Type analysis; after ~2 seconds idle, “Saving...” then a “Last saved X seconds ago” status appears.
- Actions:
  - Save Draft button is distinct from Submit (disabled while saving).
  - Submit & Continue advances to the next decision; final step shows “Submit Final Decision”.
- Keyboard Shortcuts:
  - Alt + ] next decision (if available), Alt + [ previous (if available).

## 4) Community Responses
- In a completed case view, locate Community Responses.
- Sorting:
  - Tabs: Top, New, Following (Following falls back to Top for now).
  - Switch tabs; results reorder as expected.
- Interactions:
  - Toggle like; count updates; button style reflects state.
  - Placeholder “Mark as helpful” and “Reply” buttons are present (non-functional).
- Pagination:
  - Load more works with stable ordering.

## 5) Progress + Analytics
- Lesson progress (server-instrumented):
  - Reading a lesson should POST to /api/progress/lessons. Confirm:
    - 25% → ‘lesson_progress’ event with {progressPercentage: 25}
    - 50% → ‘lesson_progress’ event with {progressPercentage: 50}
    - 100% or status=completed → event with {progressPercentage: 100}
- Onboarding:
  - Go through /onboarding. Completing Steps 1–4 sends ‘onboarding_step_completed’ with step number.
- Case decision:
  - Submitting a decision sends ‘case_decision_submitted’ with {decisionPointId, decisionIndex, hasPersonaChat}.
- Response liked:
  - Toggling like sends ‘response_liked’ with {responseId, caseId, liked, userId}.

Tip: If PostHog is configured, verify events in the Network tab or PostHog console.

## 6) Notifications
- As User A, post a public response on a case.
- As User B, like User A’s response.
- Switch to User A:
  - Bell icon appears in Navbar if there are notifications.
  - Open bell menu; verify a notification “Someone liked your response” with a link to the correct case page.
  - Click “Mark all read” clears unread badges.
- Link correctness:
  - The link must be to /library/case-studies/[caseId] and open the case.

## 7) Public Profiles
- Visit /u/[username]
- Validate:
  - Avatar or fallback badge, display name, @username, join time (“Joined X ago”).
  - Stats: Lessons Completed, Case Responses, Total Likes, Time Invested (hours).
  - Recent Contributions: show case title, like count, relative time, and a snippet of their response.
  - Clicking items takes you to content pages.
- Edge:
  - Private profiles (isPublic=false) should return 404.

## 8) Weekly Digest Email (Manual trigger)
- Set CRON_SECRET in environment.
- POST /api/email/weekly-summary with header Authorization: Bearer <CRON_SECRET>
- Validate:
  - Summary includes activities (articles/lessons/simulations) if any.
  - Recommended for Next Week includes up to 3 smart items (lesson or case) with correct URLs.
  - If using Resend in dev, verify request success or mocked logs.

## 9) Library Information Architecture (IA)
- Open /library
- Tabs:
  - Continue, Articles, Case Studies, Saved, Trending.
  - Each tab shows content or a contextual Empty State with clear actions (e.g., Browse Curriculum).
- Ensure no duplicate content across sections.

## 10) Accessibility + Desktop-first polish
- Check tab navigation order and focus ring on interactive elements in:
  - Lesson reader (buttons, TOC links)
  - Dashboard cards
  - Case workspace buttons
  - Library tabs
- Verify headings are logical (H1/H2/H3) and landmarks are consistent.

## 11) Error/Loading/Empty States
- Temporarily simulate network errors (e.g., throttle or fail API):
  - Loading states show lightweight skeleton/spinners (no layout shift).
  - Error states show clear retry or informative text.
  - Empty states offer next-step CTAs.

## 12) Edge Cases
- Dashboard when user has 0 progress:
  - Weekly Goal defaults to 2h; 0 current hours; Streak hidden or 0.
  - Continue Learning absent, Recommended Next should still show.
- Weekly Goal parsing:
  - Bio variations like “Weekly commitment: 3 hours”, ensure parsing is case-insensitive and robust.
- Notifications:
  - If no notifications exist, bell hides; once notifications exist, it appears.

---

# Expected Results: Quick Reference

- Weekly Goal: Progress bar and numbers match accumulated time from lesson progress updated since Monday (00:00).
- Streak: Counts consecutive days with completions (by completedAt day).
- Recommendation blocks and “Apply in Case Study” CTAs appear contextually in lessons.
- Case Workspace: clear autosave feedback; distinct Save vs Submit; keyboard shortcuts work.
- Community Responses: Sort tabs work; like toggles; link to case study.
- Notifications: New like creates a notification for the response owner, linking to the case page.
- Public Profiles: Show stats and contributions; non-public returns 404.
- Weekly Digest: Includes activity summary + 3 smart next steps (lesson or case).
