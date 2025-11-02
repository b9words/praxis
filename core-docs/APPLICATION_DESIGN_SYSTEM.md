# Execemy Application Design System

## Core Design Principles

**McKinsey/HBR Editorial Aesthetic**
- Sophisticated, data-driven layouts optimized for analytical work
- Editorial typography: crisp hierarchy, generous whitespace, precise alignment
- Neutral color palette exclusively (neutral-50 through neutral-900)
- Structural elements: thin dividers (1px), no decorative elements
- Data-first presentation: metrics presented as executive KPIs
- Grid-based layouts: precise 12-column grid system
- Information density: more data visible, less scrolling
- Professional spacing: generous margins, tight internal padding

## UX Writing: "The Analyst's Edge" Voice

**Guiding principles:**
- Incisive, data-driven, and direct
- Respectful of user intellect (no condescension)
- Precision-focused terminology
- Scenario-based feedback (avoid "correct/incorrect")
- Use "we" to imply shared analytical journey

**Key terminology:**
- "Library" → **"Intel"** (Intelligence Library)
- "Simulations" → **"The Arena"**
- "Community" → **"The Network"**
- "Profile" → **"Your Dossier"**
- "Mark as Complete" → **"Internalize"**
- "Start Simulation" → **"Deploy to Scenario"**
- "After-Action Report" (debriefs)
- **"Competency Matrix"** (radar charts)
- **"Engagement History"** (completed simulations)

## Layout Structure

### Application Container

```tsx
<div className="min-h-screen bg-gray-50">
  <Navbar />
  <main className="">{children}</main>
</div>
```

### Page Layout Pattern

**Standard page structure:**
- Background: `bg-gray-50` (softer than public pages' `bg-white`)
- Content container: `max-w-7xl mx-auto px-6 lg:px-8`
- Section padding: `py-8` or `py-12` (tighter than public `py-24`)
- Maintain left/right alignment with public pages

## Navigation (Navbar)

**Component:** `components/layout/Navbar.tsx`

**Structure:**
- Background: `bg-white border-b border-gray-200`
- Sticky: `sticky top-0 z-50`
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Height: `h-16`

**Navigation Links:**
- Active state: `border-blue-500 text-blue-600 bg-blue-50`
- Inactive: `border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50`
- Icons: Lucide React icons (BarChart3, BookOpen, Target, Users)
- Labels: Dashboard, Intel, The Arena, The Network

**User Menu:**
- Avatar dropdown with profile info
- Progress indicators (articles completed, simulations completed)
- "Your Dossier" link (not "Profile")
- "Sign out" action

## Dashboard

**Page:** `app/(app)/dashboard/page.tsx`

**McKinsey-Style Layout:**
- **Top Section**: Key metrics in horizontal row (KPI cards)
- **Primary Section**: Two-column grid (main content + sidebar)
- **Secondary Section**: Full-width data tables/lists
- **Spacing**: Generous vertical rhythm (py-12 between major sections)
- **Grid**: 12-column system for precise alignment

**Layout Structure:**
```
[Header: Page title + status badge]
  └─ Spacing: mb-8

[KPI Row: 4 metrics in equal-width cards]
  └─ Grid: grid-cols-4 gap-6
  └─ Each card: p-6, border-1, bg-white

[Primary Content: 2-column grid]
  ├─ Left (8 cols): Optimal Next Move + Profile Matrix
  └─ Right (4 cols): Network Activity + Quick Stats
  └─ Gap: gap-8

[Secondary: Full-width sections]
  └─ Recent Activity (table-style list)
  └─ Progress Overview (if applicable)
```

**Visual Hierarchy:**
- Section headers: `text-xl font-medium text-gray-900` with `mb-6`
- Divider lines: `border-b border-gray-200` between major sections
- Metric labels: `text-xs text-gray-500 uppercase tracking-wide`
- Metric values: `text-2xl font-semibold text-gray-900`
- Supporting text: `text-sm text-gray-600`

**Component Patterns:**
- KPI Cards: Minimal borders, no shadows, data-focused
- Tables: Dense rows, subtle hover states, clear headers
- Lists: Compact spacing, clear visual separation

## Intelligence Library (Intel)

**Page:** `app/(app)/library/curriculum/page.tsx`

**Navigation label:** "Intel"

**Components:**
- `LibrarySidebar`: Filtering and navigation
- `ArticleGrid`: Article cards
- `SmartStudyAssistant`: "Query Assistant" (not "Study Assistant")

**Key elements:**
- Search placeholder: "Search frameworks, models, case files..."
- Action button: "Internalize" (not "Mark as Complete")
- Bookmark tooltip: "Save for future analysis"
- Query Assistant placeholder: "Ask a clarifying question. Precision is key."

**Article cards:**
- Hover states with subtle border transitions
- Progress indicators
- Competency tags

## The Arena (Simulations)

**Page:** `app/(app)/simulations/page.tsx`

**Navigation label:** "The Arena"

**Simulation cards:**
- Title format: `Scenario XXX: [Title]`
- Start button: **"Deploy to Scenario"** (not "Start")
- Status indicators
- Difficulty/complexity badges

**Workspace layout:**
- Header: "Active Simulation: [Scenario Name]"
- Sidebar: "Briefing Documents" (not "Case Files")
- Decision points: "Decision Point XX: [Name]"
- All prompts use Analyst voice

**Components:**
- `SimulationWorkspace`: Main workspace container
- Case study blocks: RichTextEditorBlock, FinancialModelBlock, etc.
- All blocks updated with Analyst voice prompts

## After-Action Reports (Debriefs)

**Page:** `app/(app)/debrief/[simulationId]/page.tsx`

**Page title format:** "After-Action Report: [Simulation Title]"

**Structure:**
- Header: "Performance Debrief"
- Score section: "Competency Analysis"
- Loading messages:
  - "Processing simulation data..."
  - "Running consequence analysis..."
  - "Calibrating performance against rubric..."
- Share button: **"Transmit Debrief"**
- Recommended reading: "Further Intelligence"

**Components:**
- `ScoreReveal`: Competency breakdown
- `RecommendedReading`: "Further Intelligence" section
- `ShareButtons`: "Transmit Debrief" action

## Your Dossier (Profile)

**Page:** `app/(app)/profile/[username]/page.tsx`

**Navigation label:** "Your Dossier" (in dropdown)

**Structure:**
- Page title: "[Username]'s Dossier"
- Radar chart: **"Competency Matrix"**
- Completed simulations: **"Engagement History"**
- Edit button: **"Update Dossier"**

**Settings page:**
- Profile visibility: "Profile Visibility: [Public/Classified]"
- Tooltip: "A public dossier can be shared as a signal of your demonstrated acumen"

## The Network (Community)

**Page:** `app/(app)/community/page.tsx`

**Navigation label:** "The Network"

**Structure:**
- Forum title: **"The Exchange"**
- New thread button: **"Open a New Thread"**
- Reply button: **"Add to Analysis"**
- Like/Upvote: **"Insightful"** or **"▲"**

**Leaderboard:**
- Title: **"Performance Rankings"**
- Table headers:
  - `Operative`
  - `Engagements Completed`
  - `Mean Competency Score`

## Component Patterns

### Cards (Application Context)

**Base card:**
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
  {/* Content */}
</div>
```

**With hover accent:**
```tsx
<div className="relative bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
  <div className="absolute top-0 left-0 w-full h-[0.5px] bg-neutral-900 opacity-0 hover:opacity-20 transition-opacity"></div>
  {/* Content */}
</div>
```

### Buttons

**Primary action:**
```tsx
<Button className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg">
  Engage Target
</Button>
```

**Secondary action:**
```tsx
<Button variant="outline" className="border-gray-300 hover:border-gray-400 rounded-lg">
  View Details
</Button>
```

**Note:** Application buttons use `rounded-lg` (not `rounded-none` like public pages) for softer, more approachable feel in workspace contexts.

### Form Elements

**Inputs:**
```tsx
<Input className="rounded-lg border-gray-300 focus:border-neutral-900 focus:ring-neutral-900" />
```

**Labels:**
- Use Analyst voice
- Direct, specific instructions
- No condescending language

**Error messages:**
- Precision-focused, direct tone
- Example: "Invalid email format" not "Please enter a valid email"

### Progress Indicators

**Article progress:**
```tsx
<div className="text-sm text-gray-600">
  {articlesCompleted}/{totalArticles} articles internalized
</div>
```

**Simulation progress:**
```tsx
<div className="text-sm text-gray-600">
  {simulationsCompleted} engagements completed
</div>
```

**Progress bars:**
- Use neutral colors
- Show percentage or fraction
- Clear, data-driven presentation

### Status Badges

**Completed:**
```tsx
<Badge className="bg-green-100 text-green-800">Internalized</Badge>
```

**In Progress:**
```tsx
<Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
```

**Pending:**
```tsx
<Badge className="bg-gray-100 text-gray-800">Pending</Badge>
```

## Typography (Application Context)

**Page titles:**
```tsx
<h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
```

**Section headers:**
```tsx
<h2 className="text-xl font-medium text-gray-900">Optimal Next Move</h2>
```

**Card titles:**
```tsx
<h3 className="text-lg font-medium text-gray-900">Scenario 001: Retail Expansion</h3>
```

**Body text:**
- Primary: `text-gray-900`
- Secondary: `text-gray-600`
- Tertiary: `text-gray-500`
- Small text: `text-sm text-gray-500`

**Note:** Application typography uses `font-semibold` and `font-medium` (not `font-light`) for better readability in dense information contexts.

## Color Palette (Application Context)

**Backgrounds:**
- Main background: `bg-gray-50` (softer than public `bg-white`)
- Card backgrounds: `bg-white`
- Hover states: `hover:bg-gray-50`

**Borders:**
- Default: `border-gray-200`
- Hover: `border-gray-300`
- Active: `border-blue-500` (for navigation)

**Text:**
- Primary: `text-gray-900`
- Secondary: `text-gray-600`
- Tertiary: `text-gray-500`
- Muted: `text-gray-400`

**Status colors:**
- Success: `bg-green-100 text-green-800`
- Info: `bg-blue-100 text-blue-800`
- Warning: `bg-yellow-100 text-yellow-800`
- Error: `bg-red-100 text-red-800`

## Spacing (Application Context)

**Page padding:**
- Top/bottom: `py-8` or `py-12`
- Sides: `px-6 lg:px-8`

**Card spacing:**
- Internal: `p-6`
- Grid gaps: `gap-6` or `gap-8`

**Form spacing:**
- Between fields: `space-y-4`
- Between sections: `space-y-6`

## Interactive Elements

### Links

**Internal navigation:**
```tsx
<Link href="/library/curriculum" className="text-gray-700 hover:text-gray-900 transition-colors">
  Intel
</Link>
```

**External links:**
- Open in new tab when appropriate
- Use Analyst voice for link text

### Dropdowns

**User menu:**
- Profile info at top
- Progress indicators
- Action items below
- Sign out at bottom

### Tooltips

**Guidelines:**
- Concise, actionable text
- Analyst voice
- Appear on hover after short delay
- Example: "Save for future analysis" (not "Click to bookmark")

## Loading States

**Skeleton loaders:**
- Match content structure
- Subtle gray backgrounds
- Smooth transitions

**Loading messages (Analyst voice):**
- "Processing simulation data..."
- "Running consequence analysis..."
- "Calibrating performance against rubric..."
- "Retrieving intelligence..."

## Empty States

**Guidelines:**
- Use Analyst voice
- Provide actionable next steps
- Show relevant data/statistics when available

**Examples:**
- "No engagements yet. Deploy to your first scenario."
- "No intelligence internalized. Begin with Year 1 foundations."
- "No active threads. Open a new thread to initiate discussion."

## Error States

**Error messages:**
- Precision-focused, direct tone
- Explain what went wrong (not just "Error occurred")
- Suggest recovery actions when applicable

**Examples:**
- "Simulation data could not be retrieved. Verify your connection."
- "Failed to save decision. Review required fields and retry."

## Responsive Design

**Breakpoints:**
- Mobile: Default (< 640px)
- Tablet: `sm:` (≥ 640px)
- Desktop: `lg:` (≥ 1024px)

**Layout adjustments:**
- Mobile: Single column, stacked components
- Tablet: 2-column grids where appropriate
- Desktop: Full 3-column layouts, sidebars visible

## Accessibility

**Guidelines:**
- All interactive elements keyboard accessible
- Proper ARIA labels for icons and actions
- Color contrast meets WCAG AA standards
- Focus states clearly visible
- Screen reader friendly text for Analyst voice terminology

## Implementation Checklist

### Core Application Pages
- [ ] Dashboard (`app/(app)/dashboard/page.tsx`)
- [ ] Intelligence Library (`app/(app)/library/curriculum/page.tsx`)
- [ ] The Arena (`app/(app)/simulations/page.tsx`)
- [ ] After-Action Reports (`app/(app)/debrief/[simulationId]/page.tsx`)
- [ ] Your Dossier (`app/(app)/profile/[username]/page.tsx`)
- [ ] The Network (`app/(app)/community/page.tsx`)

### Navigation & Layout
- [ ] Navbar component with Analyst voice labels
- [ ] Application layout wrapper
- [ ] Breadcrumbs (where applicable)

### Components
- [ ] Dashboard widgets (SmartRecommendation, CommunityFeed)
- [ ] Library components (ArticleGrid, LibrarySidebar, SmartStudyAssistant)
- [ ] Simulation workspace components
- [ ] Case study blocks (all variants)
- [ ] Profile components (Competency Matrix, Engagement History)
- [ ] Community components (ThreadList, ReplyForm, Leaderboard)

### UX Writing
- [ ] All navigation labels updated to Analyst voice
- [ ] All button labels updated
- [ ] All page titles updated
- [ ] All error messages updated
- [ ] All empty states updated
- [ ] All tooltips updated
- [ ] All form labels and placeholders updated

### Email Templates
- [ ] Welcome email (Analyst voice)
- [ ] Application status emails
- [ ] Notification emails

## Notes

**Key differences from public-facing system:**
1. **Background:** `bg-gray-50` instead of `bg-white` (softer for extended use)
2. **Border radius:** `rounded-lg` instead of `rounded-none` (more approachable)
3. **Typography weight:** `font-semibold`/`font-medium` instead of `font-light` (better readability)
4. **Architectural lines:** Minimal use (focused on content, not decoration)
5. **Spacing:** Tighter padding (`py-8` vs `py-24`) for information density
6. **UX Writing:** Full "Analyst's Edge" voice implementation

**Consistency with public system:**
- Color palette (neutral-50 through neutral-900)
- Max-width container (`max-w-7xl`)
- Padding pattern (`px-6 lg:px-8`)
- Professional, editorial aesthetic
- Clean, minimal approach

