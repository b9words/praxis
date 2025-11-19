# Interaction Guidelines

## Notification Taxonomy

### Toast (Sonner) - Ephemeral, Non-blocking
**Use for:** Quick confirmations that don't require user action.

**Examples:**
- "Draft saved"
- "Settings updated"
- "Link copied to clipboard"

**Rules:**
- Duration: 3-4 seconds max
- Never use for critical flows or errors that need attention
- Never use for long-running operations
- Position: top-right (default)

### Inline Banner - Contextual, Non-blocking
**Use for:** Validation errors, section-specific API failures, empty states, contextual success messages.

**Examples:**
- Form validation errors below input fields
- API error message in the affected section
- "Response published successfully" inline in the responses section
- Empty state with CTA in a content area

**Rules:**
- Appears near the trigger/context
- Can be dismissed manually
- Stays visible until user action or state change
- Use for errors that need to be addressed in context

### Modal Dialog - Blocking/Focus
**Use for:** State-changing confirmations, multi-step actions, long-running progress with cancellation.

**Examples:**
- "Publish Response?" confirmation before publishing
- "Submit Final Decision?" confirmation
- "Analyzing Decision..." progress modal with steps
- Plan selection confirmation before checkout

**Rules:**
- Blocks interaction until resolved
- Must have clear action buttons (Confirm/Cancel)
- Progress modals should show steps and allow cancellation
- Focus trap, Esc to close, aria labels required

## Implementation Patterns

### Long-running Operations
1. Show ProgressModal immediately
2. Update status steps (Queued → Processing → Completed)
3. Auto-close on success OR show inline error on failure
4. Never use hanging toasts

### Form Submissions
1. Show ConfirmModal with action summary
2. On success: show inline success banner in context
3. Provide next-step guidance inline
4. Avoid toasts for success

### Autosave
1. Show inline status next to editor ("Saving..." → "Saved Xs ago")
2. Never use toasts
3. Update status text only, no popups

### Error Handling
1. Inline banner for form/context errors
2. Modal for critical errors requiring immediate attention
3. Toast only for non-critical transient errors (rare)

## Accessibility Requirements

### Modals
- Focus trap (first focusable element on open)
- aria-labelledby and aria-describedby
- Esc key to close
- Logical tab order
- Return key on primary action, Cancel on secondary

### Accordions/Tabs
- Move focus to heading on expand/tab change
- aria-live="polite" announcement for state changes
- Keyboard navigation (Arrow keys for accordions, Tab for tabs)

### Inline Feedback
- aria-live regions for dynamic content updates
- Clear visual and text indicators
- Focus management for critical updates


