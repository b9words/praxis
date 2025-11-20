Here is **Document 2 (Part 2)**.

This covers the remaining key pages (Library, Case Studies, Onboarding, Billing) with the same "Executive Operating System" design philosophy.

***

# Design Directive 2 (Continued): Specific Page Revamps
**Focus:** Library, Mission Selection, Onboarding, & Billing
**Goal:** Consistency in the "Command Center" aesthetic.

### 5. The Library (`app/(app)/library/page.tsx` & `/curriculum`)
**Current Vibe:** A blog archive or standard CMS listing.
**New Vibe:** **The Intelligence Database.**

**The Revamp:**
*   **Switch to "Dense List" View (Linear Style):**
    *   Executives often prefer scanning lists over giant cards with stock photos.
    *   **Action:** Create a "Data Grid" layout option.
    *   **Columns:**
        1.  `ID` (e.g., "MOD-01" in Mono font, gray).
        2.  `Title` (Serif, Bold, Dark text).
        3.  `Topic Tags` (Small pill badges, border-only).
        4.  `Est. Time` (Mono font).
        5.  `Action` (Small "Arrow" icon).
*   **The "Quick-Look" Drawer:**
    *   *Interaction:* Clicking a row shouldn't immediately navigate. It should open a **Side Drawer (Sheet)** on the right.
    *   *Why:* It feels faster and allows the user to browse "assets" without losing their place in the database.
*   **Asset Classification:**
    *   Rename "Modules" to **"Briefings."**
    *   Rename "Lessons" to **"Intel."**
    *   *Visual:* Add a status indicator to every row: `UNREAD` (Hollow circle), `IN PROGRESS` (Half-filled circle), `ARCHIVED` (Checkmark).

### 6. Case Study Index (`app/(app)/library/case-studies/page.tsx`)
**Current Vibe:** "Choose your adventure" book covers.
**New Vibe:** **Mission Deployment Board.**

**The Revamp:**
*   **The "File Folder" Aesthetic:**
    *   Style the case cards to look like **Manila Folders** or **Digital Dossiers**.
    *   **Top Tab:** "CASE #004: UNIT ECONOMICS" (Mono font, inverted colors: Black bg, White text).
    *   **Body:** White background with a strict border.
    *   **Metadata Footer:** Display difficulty as a "Clearance Level" (e.g., "Level 1 Clearance" vs "Level 3 Clearance").
*   **Active vs. Historical:**
    *   Split the view into two distinct sections using a heavy divider.
    *   **"Active Operations" (Top):** Any case currently in progress. Make this section dark mode (`bg-slate-900` card) to signal "This is live."
    *   **"Scenario Archive" (Bottom):** Available cases. Light mode styling.
*   **Hover Effect:**
    *   When hovering a case card, display a **"DECISION REQUIRED"** badge that fades in. It prompts action.

### 7. Billing & Access (`app/(app)/profile/billing/page.tsx`)
**Current Vibe:** Standard SaaS pricing table (Good, Better, Best).
**New Vibe:** **Security Clearance Levels.**

**The Revamp:**
*   **Horizontal "Stack" Layout:**
    *   Instead of 3 tall cards side-by-side, use 3 horizontal bars stacked vertically (like a server rack).
*   **Visual Hierarchy:**
    *   **Explorer:** "Level 1 Access." Gray border.
    *   **Professional:** "Level 2 Access." Blue/Indigo border + Glowing indicator light.
    *   **Executive:** "Level 3 Access (Classified)." Black border + Gold/Yellow text accents.
*   **The "Active" Indicator:**
    *   On the user's current plan, add a pulsing green LED dot (`w-2 h-2 bg-green-500 rounded-full animate-pulse`) next to the plan name.
    *   Label: `STATUS: ACTIVE`.
*   **Micro-Interaction:**
    *   When switching plans, use a toggle switch that looks like a physical slider mechanism.

### 8. Onboarding (`app/(app)/onboarding/page.tsx`)
**Current Vibe:** A wizard form ("Tell us about yourself").
**New Vibe:** **System Initialization.**

**The Revamp:**
*   **The "Terminal" Header:**
    *   Instead of "Welcome to Execemy," use a typewriter effect: `> INITIALIZING OPERATIVE PROFILE...`
*   **Input Styling:**
    *   Remove standard input borders. Use **Underline Inputs** only (`border-b-2 border-slate-200 focus:border-slate-900`). This looks like filling out a paper form or a terminal command.
*   **Progress as "Boot Sequence":**
    *   Instead of "Step 1 of 3," use a vertical sidebar list that looks like a boot log:
        *   `[OK] Identity Verification` (Green text)
        *   `[..] Professional Calibration` (Blinking cursor)
        *   `[  ] Goal Parameter Set` (Gray text)
*   **The Final Button:**
    *   Don't say "Get Started."
    *   Say **"ESTABLISH RESIDENCY"** or **"ENTER TERMINAL."**

### 9. Community / Waitlist (`app/(app)/community/...`)
**Current Vibe:** A waiting room.
**New Vibe:** **The Network Node.**

**The Revamp:**
*   **Visual Map:**
    *   Replace the "Users" icon with a subtle **Network Graph** background (faint lines connecting dots).
*   **The Counter:**
    *   Style the waitlist count like a **Ticker**:
        *   `NETWORK NODES: 1,420` (Mono font).
*   **The "Founding Member" Card:**
    *   If the user is on the waitlist, give them a digital **"Founding Member Card"** on screen.
    *   Style it like a credit card (Black matte texture, Gold text).
    *   Add a "Copy Member ID" button. This makes the waitlist feel like an exclusive club, not a line.

### 10. Bookmarks (`app/(app)/library/bookmarks/page.tsx`)
**Current Vibe:** A shopping cart of saved items.
**New Vibe:** **The Briefcase.**

**The Revamp:**
*   **Two-Column Layout:**
    *   **Left:** "Briefcase Contents" (List of saved items).
    *   **Right:** "Preview Pane." Hovering a bookmark on the left shows its summary/stats on the right immediately (no click needed).
*   **"Read Later" vs "Reference":**
    *   Allow users to toggle items between "Action Queue" (things to do) and "Reference Archive" (things to keep).
    *   *Technical:* Just a simple local state toggle or a new DB field, but visually separates "Task" from "Storage."

***

### Summary of Design Tokens for These Pages:

*   **Font:** `Mono` font is essential here. Use it for IDs, Dates, Statuses, and Pricing.
*   **Colors:** Use `Slate-100` for backgrounds of "Archives" and `Slate-900` for "Active Missions."
*   **Shapes:** strict `rounded-none`. Borders are `1px solid #E2E8F0`.
*   **Icons:** Use `Lucide` icons with `stroke-width={1.5}` (thinner, sharper) to match the professional vibe.