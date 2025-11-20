Here is **Document 2 of 2**.

This document translates the "Executive Operating System" visual identity into specific layout changes for your key pages.

The goal is **Low-Code High-Impact**: these changes rely mostly on rearranging existing data, CSS styling, and layout shifts (Tailwind/Grid), rather than building complex new backend features.

***

# Design Directive 2: Specific Page Revamps
**Theme:** From "Consumption" to "Operation"
**Focus:** Dashboard, Lesson View, Debrief, and Profile.

### 1. The Dashboard (`app/(app)/dashboard/page.tsx`)
**Current Vibe:** A streaming service (Netflix-style shelves). "Here is stuff to watch."
**New Vibe:** **A Morning Briefing / HUD.** "Here is your status and your mission."

**The Revamp:**
*   **Replace the Greeting with a "Status Card":**
    *   Instead of "Welcome back, User," create a full-width, high-contrast card at the top.
    *   **Left side:** "Readiness Score" (Average of their competency scores). Display it big: `4.2/5.0`.
    *   **Right side:** "Current Streak" visual. Use a GitHub-style contribution graph (a row of 7 small squares, green for active days, gray for inactive). *Dev Note: This is just rendering 7 divs based on existing login/activity logs.*
*   **The "Next Optimal Move" (Primary Action):**
    *   Take the first item from `recommendation` or `jumpBackInItems`.
    *   Make it huge. Do not put it in a shelf.
    *   Style it like a **Mission Ticket**:
        *   *Top:* "PRIORITY TASK" (Monospace, small, blinking dot).
        *   *Middle:* Lesson/Case Title (Large Serif font).
        *   *Bottom:* "Est. Time: 12 min" | Button: "Initialize Session" (instead of "Start").
*   **Condensed Shelves:**
    *   Move the standard shelves ("Jump Back In", "Strengthen Core") below the fold. Make the cards smaller/denser (like a file explorer) rather than large posters.

### 2. The Lesson View (`app/(app)/library/curriculum/.../page.tsx`)
**Current Vibe:** A blog post or textbook chapter.
**New Vibe:** **An Analyst's Workbench.**

**The Revamp:**
*   **The "Split-Screen" Layout (Desktop):**
    *   Currently, you have content centered and TOC sticky on the right.
    *   **Change:** Force a strict 50/50 or 60/40 split.
        *   **Left Panel (Scrollable):** The Markdown Content. Give it a "Paper" background (Off-white/Cream).
        *   **Right Panel (Fixed):** The "Active Toolkit." This panel stays dark (Navy/Slate).
*   **Populate the "Toolkit" (Right Panel):**
    *   Move **Key Takeaways** here (make them look like a checklist).
    *   Move **Reflections/Inputs** here. Instead of embedding inputs inside the text flow, pull them out to the right panel.
    *   *Effect:* The user reads on the left, and "works" on the right. It mimics having a document open on one side and a notebook on the other.
*   **Progress "Timeline" instead of Bar:**
    *   Remove the top horizontal progress bar.
    *   Add a thin vertical line in the Left Panel margin. As they scroll, the line fills up. It feels less like a "loading screen" and more like "reading depth."

### 3. The Debrief / Simulation Result (`app/(app)/debrief/.../page.tsx`)
**Current Vibe:** A test score. "You got an 80%."
**New Vibe:** **An After-Action Report (AAR).**

**The Revamp:**
*   **The "Stamp" Aesthetic:**
    *   Instead of a plain number, frame the Overall Score inside a stamp-like border that looks like it was inked onto the page. Rotate it slightly (-2deg).
    *   Color code it: Green ("CERTIFIED"), Yellow ("PROVISIONAL"), Red ("INCOMPLETE").
*   **Comparator Bar (Social Proof):**
    *   You already calculate specific scores. Add a simple gray bar behind the user's score bar representing the "Cohort Average."
    *   *Visual:* User score (Blue) vs. Cohort (Gray). This triggers the competitive executive instinct immediately.
*   **The "Signature" Footer:**
    *   At the bottom of the debrief, add a generated "Digital Signature" block.
    *   *Content:* "Verified by Execemy System | [Date] | [Time]."
    *   *Font:* Monospace, low opacity. It makes the page feel like an official record.

### 4. The Profile (`app/(app)/profile/[username]/page.tsx`)
**Current Vibe:** Social Media profile (Avatar + Bio).
**New Vibe:** **Executive Dossier / Baseball Card.**

**The Revamp:**
*   **The Header Card:**
    *   Style the top section to look like an ID Badge.
    *   Put the photo on the left, but make the text distinct metadata fields:
        *   `OPERATIVE: John Doe`
        *   `ID: @johndoe`
        *   `TENURE: 2 Years`
*   **Skill Tickers:**
    *   In the Competency Matrix section, don't just show the Radar Chart.
    *   Add a "Ticker Tape" row above it.
    *   *Visual:* `STRATEGY ▲ 4.2`  `FINANCE ▼ 3.1`  `LEADERSHIP ▲ 4.8`.
    *   Use colors (Green/Red) to show if they are above/below the cohort average.
*   **Simulation History as a Ledger:**
    *   Turn the list of completed simulations into a dense table (Data Grid).
    *   Columns: `CASE ID` (Mono), `DATE`, `SCORE`, `STATUS`.
    *   This looks like a transaction history log, which feels high-utility and "earned."

### Summary of "Low-Code" Technical Actions:

1.  **CSS Grid:** Heavily utilize `grid-cols-12` to create the dashboard and split-screen layouts. No new React components needed, just layout restructuring.
2.  **Data re-use:** You aren't creating new data (like cohort averages) if you don't have them; just hardcode a "Target" (e.g., 4.0/5.0) to compare against for now.
3.  **Styling only:** The "Ticker Tape" and "ID Badge" are just Tailwind styling changes to your existing data display components.