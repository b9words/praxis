-- Year 1, Domain 1.4: People & Organizational Acumen Articles

-- Article 13: OKRs Framework
INSERT INTO public.articles (id, competency_id, title, content, status) VALUES
('y1-a13-0000-0000-0000-0000-000000000013', 'y1-d1-4100-0000-0000-0000-000000000001', 'Framework: OKRs (Objectives and Key Results)',
'### Core Principle

OKRs (Objectives and Key Results) are a goal-setting framework that creates alignment and accountability across an organization. Popularized by Google, OKRs answer two questions: **Where do we want to go?** (Objective) and **How will we know we''re getting there?** (Key Results).

The power of OKRs lies in their simplicity and transparency. When done well, everyone in the company knows what matters most, how success is measured, and how their work connects to company goals.

**Objective:** Qualitative, inspirational goal (the "what")
**Key Results:** Quantitative, measurable outcomes (the "how we measure success")

**Formula:**
"I will **[Objective]** as measured by **[Key Result 1, 2, 3]**."

### The Framework / Model

**OKR Structure:**

```
COMPANY OBJECTIVE: Become the leading project management tool for remote teams
  
  KR1: Grow DAU from 10,000 to 50,000
  KR2: Achieve 40% market share among remote-first companies (500+ employees)
  KR3: Reach $10M ARR
  
  ↓ Cascades to Team OKRs ↓
  
  PRODUCT TEAM OBJECTIVE: Ship features that delight remote teams
    KR1: Launch async video messaging feature with 20% adoption
    KR2: Improve app performance (load time <2 seconds)
    KR3: Increase weekly active feature usage from 3 to 5 features per user
  
  MARKETING TEAM OBJECTIVE: Become the thought leader in remote work
    KR1: Publish 24 high-quality articles (2 per month)
    KR2: Grow email subscriber list from 5,000 to 25,000
    KR3: Generate 500 MQLs per month from content
```

**OKR Principles:**

**1. Ambitious but Achievable:**
- Aim for 60-70% confidence you''ll hit it
- "If we hit 100% of all OKRs, we weren''t ambitious enough"
- Google targets 70% average achievement (hitting 60-70% is success)

**2. Measurable:**
- Key Results must be quantitative
- No subjective judgments—anyone should agree if it''s achieved

**Bad KR:** "Improve customer satisfaction"
**Good KR:** "Increase NPS from 30 to 50"

**3. Time-Bound:**
- Typically quarterly (some annual for strategic OKRs)
- Creates urgency and enables rapid course correction

**4. Transparent:**
- Everyone''s OKRs should be visible company-wide
- CEO to individual contributor
- Creates accountability and enables alignment

**5. Limited:**
- 3-5 Objectives max per level
- 3-5 Key Results per Objective
- More = dilution of focus

**How to Write Good Objectives:**

**Objectives should be:**
- Qualitative and inspirational (answers "why this matters")
- Directionally right even if KRs change
- Clear enough that everyone understands them

**Good Objectives:**
- "Delight our customers"
- "Become the fastest-growing SaaS company in our category"
- "Build the best engineering team in the industry"

**Bad Objectives:**
- "Increase revenue" (not inspirational, just an outcome)
- "Ship features" (describes activity, not outcome)

**How to Write Good Key Results:**

**Key Results should be:**
- Quantitative (numbers, percentages, yes/no)
- Outcome-based (results, not activities)
- Difficult but achievable

**Good Key Results:**
- "Grow MRR from $500K to $1M"
- "Reduce churn from 5% to 3%"
- "Achieve 4.5+ star average on app stores"

**Bad Key Results:**
- "Launch new marketing campaign" (activity, not outcome)
- "Improve product" (not measurable)
- "Hire 10 engineers" (input, not outcome—outcome is what those engineers will deliver)

### Common Pitfalls

**OKRs as To-Do Lists:** OKRs are ambitious goals, not task lists. "Fix 50 bugs" is a task, not an OKR. "Achieve <1% crash rate" is an OKR.

**Sandbagging:** Setting easy OKRs you''re 100% confident hitting defeats the purpose. OKRs should stretch the team.

**No Mid-Quarter Adjustments:** If you''re clearly off-track by week 4 of a 12-week quarter, course-correct. Don''t wait until quarterly review.

**Linking to Compensation:** Google explicitly does NOT tie OKRs directly to bonuses/promotion. Why? It encourages sandbagging and gaming. OKRs should be ambitious; compensation should reward overall performance.

**Too Many OKRs:** More than 5 objectives = loss of focus. Everything becomes a priority, meaning nothing is.

**Cascading Without Context:** Don''t just assign team OKRs from above. Teams should propose their OKRs based on how they can contribute to company OKRs.

**Confusing Committed vs. Aspirational:** 
- **Committed OKRs:** Must hit 100% (launch date, regulatory requirement)
- **Aspirational OKRs:** Aim for 70% (ambitious growth goals)

Mixing these creates confusion.

### Application Example

**Case: Implementing OKRs at a 200-Person Startup**

**Quarter 1 Company OKR:**

**Objective:** Achieve product-market fit in the enterprise segment

**Key Results:**
1. Sign 10 enterprise customers (>500 employees) with $50K+ ACV
2. Achieve 90+ NPS among enterprise customers
3. Reach 80% feature adoption for core workflows among enterprise users

**Cascade to Product Team:**

**Objective:** Ship enterprise-grade features that close deals

**Key Results:**
1. Launch SSO (single sign-on) and pass 5 enterprise security reviews
2. Ship admin dashboard used by 100% of enterprise customers
3. Reduce enterprise customer onboarding time from 30 days to 10 days

**Cascade to Sales Team:**

**Objective:** Build a repeatable enterprise sales motion

**Key Results:**
1. Close 10 enterprise deals (supports company KR1)
2. Achieve $500K in enterprise pipeline (5x quota to ensure hitting 10 deals)
3. Reduce sales cycle from 6 months to 4 months
4. Achieve 30% win rate on qualified enterprise opportunities

**Cascade to Engineering Team:**

**Objective:** Increase engineering velocity without sacrificing quality

**Key Results:**
1. Ship SSO and admin dashboard (supports product KRs)
2. Maintain <0.5% crash rate
3. Reduce production incidents from 12/month to <5/month
4. Achieve 2-week average sprint completion (was 3 weeks)

**Mid-Quarter Review (Week 6):**

**Status:**
- Company KR1: 3 of 10 enterprise deals signed (30%)—**Behind**
- Company KR2: NPS at 85—**Close to target**
- Company KR3: 65% feature adoption—**Behind**

**Analysis:** Product features are blocking sales. SSO delayed.

**Action:** Reprioritize engineering resources to SSO. Delay non-enterprise features. Update product KR1 deadline expectations.

**End of Quarter:**

**Results:**
- KR1: 7 deals (70%)—Missed target but strong progress
- KR2: NPS 92—Exceeded
- KR3: 75% adoption—Below target

**Overall: 69% achievement**—Solid for first quarter of OKRs.

**Retrospective Insights:**
- Sales pipeline was weaker than thought (need earlier pipeline building)
- SSO was critical (unblocked 4 deals once shipped)
- Enterprise onboarding still too slow (becomes Q2 priority)

**Key Lesson:** OKRs create clarity, drive alignment, and enable rapid learning. The framework forces you to define success quantitatively and track progress transparently.',
'published');

-- Article 14: Team Structure & Organizational Design
INSERT INTO public.articles (id, competency_id, title, content, status) VALUES
('y1-a14-0000-0000-0000-0000-000000000014', 'y1-d1-4200-0000-0000-0000-000000000001', 'Principles of Effective Team Structure & Organizational Design',
'### Core Principle

Organizational structure is not just an org chart—it''s the manifestation of your strategy. How you structure teams determines communication patterns, decision speed, accountability, and ultimately, what gets built and shipped. The wrong structure can doom a sound strategy.

Conway''s Law captures this truth: "Organizations design systems that mirror their communication structure." If your teams don''t talk, your products won''t integrate. If decision-making is centralized, innovation is slow.

The art of organizational design is balancing competing forces: speed vs. control, specialization vs. flexibility, autonomy vs. alignment.

### The Framework / Model

**Core Organizational Structures:**

**1. Functional Structure:**
```
              CEO
               |
    ________________________
    |      |      |       |
  Product  Eng  Sales  Marketing

All engineers report to VP Eng
All salespeople report to VP Sales
```

**Pros:**
- Deep specialization and skill development
- Economies of scale (shared resources)
- Clear career paths within function

**Cons:**
- Slow cross-functional collaboration
- Siloed thinking
- Handoffs create delays

**Best for:** Small companies (<100 people) or stable, efficiency-focused operations

**2. Divisional/Product Structure:**
```
              CEO
               |
    ________________________
    |           |          |
Product A   Product B   Product C
Division    Division    Division

Each division has own eng, sales, marketing
```

**Pros:**
- Fast decision-making within divisions
- Clear P&L ownership
- Entrepreneurial teams

**Cons:**
- Duplicated resources across divisions
- Harder to share learnings
- Can create internal competition

**Best for:** Companies with distinct product lines or geographic markets

**3. Matrix Structure:**
```
Engineers report to both:
- VP Engineering (functional manager—skills, career)
- Product Manager (product manager—what to build)
```

**Pros:**
- Flexibility and resource sharing
- Cross-functional collaboration

**Cons:**
- Confusing reporting (two bosses)
- Slow decision-making (who has authority?)
- High coordination overhead

**Best for:** Complex, project-based organizations (consulting, aerospace)

**4. Squad/Pod Model (Modern Hybrid):**
```
Squad = Cross-functional mini-team
- Product Manager
- 3-5 Engineers
- Designer
- Data Analyst

Each squad owns feature/product area end-to-end
Squads aligned through shared goals/OKRs
```

**Pros:**
- Speed (no handoffs)
- Ownership and accountability
- Scalable (add more squads)

**Cons:**
- Can duplicate effort across squads
- Requires strong inter-squad coordination
- Harder to build deep specialization

**Best for:** Modern tech companies, product-driven organizations

**Span of Control:**

How many direct reports should a manager have?

**Rule of thumb:**
- **Individual contributors:** 7-10 reports max
- **Senior managers:** 5-7 reports
- **Executives:** 5-8 reports

**Factors:**
- Task complexity (higher complexity → smaller span)
- Geographic distribution (remote → smaller span)
- Team maturity (senior team → larger span)

**Two-Pizza Team Rule (Amazon):**

Team should be small enough to feed with two pizzas (~6-10 people).

**Why?** 
- Communication overhead grows as n(n-1)/2
- 10-person team: 45 relationships
- 20-person team: 190 relationships
- Larger teams → slower decisions

**Decision Authority: RACI Matrix**

For every decision/task, clarify:
- **R (Responsible):** Does the work
- **A (Accountable):** Owns the outcome (only one person)
- **C (Consulted):** Provides input
- **I (Informed):** Kept in loop

**Example: Launching New Feature**

| Person | Role |
|--------|------|
| Product Manager | **A** (accountable for success) |
| Engineers | **R** (build it) |
| Design | **R** (design it) |
| Marketing | **C** (consulted on GTM) |
| Sales | **I** (informed of launch) |
| CEO | **I** |

### Common Pitfalls

**Reorganizing Too Often:** Structure changes are disruptive. Don''t reorganize more than once per year unless critical.

**Copying Others'' Structure:** Google''s structure works for Google''s strategy and culture. Blindly copying it won''t work for you.

**Optimizing for Today''s Needs:** Design for where you''re going, not where you are.

**Example:** A 50-person startup still structured functionally won''t scale to 500. Plan for the next phase.

**Too Many Layers:** Each layer slows communication and decision-making.

**Rule:** Keep layers <5 between CEO and front-line employees.

**Unclear Accountability:** Multiple people "responsible" for an outcome → no one is accountable.

**Example:** "Product and Engineering both own the roadmap"—recipe for conflict and delays.

**No Transition Plan:** Structure changes fail without:
- Clear communication of why
- Support for displaced managers
- Time for teams to gel in new structure

**Ignoring Culture Fit:** Flat, autonomous structures require high-trust culture. Command-and-control structures require different talent.

### Application Example

**Case: Spotify''s Re-organization (2012-2013)**

**Problem at 300 People:**
- Started as functional structure (all engineers under CTO)
- Product development slowing down
- Too many dependencies between teams
- 6-month release cycles (vs. 2-week sprints at startup phase)

**New Structure: Squad Model**

**Design:**
```
Tribe: ~100 people, related product area (e.g., "Discovery")
  ↓
Squad: 6-10 people, specific feature (e.g., "Search")
  - Product Manager
  - 4-6 Engineers
  - Designer
  - Data Analyst
  
Chapter: Functional grouping (all engineers across squads)
  - Led by Chapter Lead
  - Handles skill development, career growth
  
Guild: Interest-based community (e.g., "Web Performance Guild")
  - Share learnings across entire company
```

**Key Decisions:**

1. **Squad Autonomy:** Each squad chooses:
   - How to work (Scrum, Kanban, etc.)
   - What to build within their area
   - Tech stack and architecture (within guardrails)

2. **Alignment Mechanisms:**
   - Company-wide OKRs cascade to tribes
   - Tribes align squads on strategy
   - Guilds share best practices

3. **No Handoffs:** Squad has all skills needed to ship (no separate QA team)

4. **Product Ownership:** Squad owns their area long-term (not project-based teams)

**Results:**

**Before:**
- Release cycle: 6 months
- Features shipped: ~10 per quarter
- Deploy frequency: Weekly

**After:**
- Release cycle: 2 weeks per squad
- Features shipped: ~50 per quarter (5x increase)
- Deploy frequency: Daily (multiple times)
- Team satisfaction: Increased (autonomy)

**Trade-offs:**
- Some duplicated work across squads
- More coordination effort needed
- Harder to enforce company-wide standards

**Mitigation:**
- Guilds share learnings to reduce duplication
- Architects embedded in multiple squads
- Platform teams provide shared services

**Key Lesson:** Structure enables or constrains strategy. Spotify''s strategy (rapid innovation, personalized experience) required autonomous squads. Traditional functional structure would have blocked it.

**Your job as a leader:** Design structure that enables your strategy, not the other way around.',
'published');

-- Article 15: Performance Management & Feedback
INSERT INTO public.articles (id, competency_id, title, content, status) VALUES
('y1-a15-0000-0000-0000-0000-000000000015', 'y1-d1-4300-0000-0000-0000-000000000001', 'Performance Management & Feedback Models That Actually Work',
'### Core Principle

Performance management is how organizations ensure people are effective, growing, and aligned with company goals. Done poorly, it''s a bureaucratic exercise that everyone dreads. Done well, it''s the engine of individual development and organizational excellence.

The shift in modern performance management: from annual reviews and stack ranking to continuous feedback, growth-oriented conversations, and outcome-based assessment. The goal isn''t to judge people, but to help them improve and succeed.

**Traditional Model:** Annual review, forced ranking, tied to compensation
**Modern Model:** Continuous feedback, growth focus, development-oriented

### The Framework / Model

**Performance Management System Components:**

**1. Goal Setting (What to Achieve)**
- Use OKRs or similar framework
- Align individual goals to team/company goals
- Quarterly or bi-annual goal setting
- Clear, measurable outcomes

**2. Ongoing Feedback (How You''re Doing)**
- Real-time, specific feedback on work
- Both positive (reinforcement) and developmental (improvement)
- From managers, peers, and direct reports (360-degree)

**3. Performance Review (Formal Assessment)**
- Quarterly or semi-annual review conversations
- Assess performance vs. goals
- Identify strengths and development areas
- Inform promotion and compensation decisions

**4. Development Planning (How to Grow)**
- Based on review insights and career aspirations
- Specific skills to develop
- Stretch assignments and learning opportunities
- Manager support and resources

**The Feedback Equation:**

**Effective Feedback = Timely + Specific + Actionable + Kind**

**Bad Feedback:** "You need to communicate better."
- Vague, not actionable

**Good Feedback:** "In yesterday''s product review, you didn''t explain the trade-offs behind the decision to delay the mobile launch. Next time, proactively address the 'why' behind key decisions so stakeholders understand your reasoning."
- Specific situation, actionable guidance

**SBI Feedback Model:**

**S (Situation):** When did it happen? What context?
**B (Behavior):** What specifically did the person do/say?
**I (Impact):** What was the result/consequence?

**Example:**

**Situation:** "In this morning''s customer call with Acme Corp..."
**Behavior:** "...you committed to a feature that''s not on our roadmap..."
**Impact:** "...which created an expectation we can''t meet and puts the deal at risk. In the future, please flag new feature requests and let me handle committing to timelines."

**Radical Candor Framework (Kim Scott):**

```
              Challenge Directly
                      |
    Obnoxious         |    Radical Candor
    Aggression        |    (GOAL)
         ____________________________
                      |
    Manipulative      |    Ruinous
    Insincerity       |    Empathy
                      |
              Care Personally
```

**Radical Candor:** Care personally AND challenge directly
- Give tough feedback because you want person to succeed
- Be direct and specific about issues
- Build trust through genuine care

**Ruinous Empathy:** Care but avoid difficult feedback
- "You''re doing great!" when they''re underperforming
- Prevents growth

**Obnoxious Aggression:** Challenge without caring
- Harsh criticism that tears down
- Creates fear, not improvement

**Manipulative Insincerity:** Neither care nor challenge
- Political maneuvering
- Fake praise and backstabbing

**Performance Review Conversation Framework:**

**1. Self-Assessment First (15 min):**
- "How do you think the quarter went?"
- "What are you most proud of?"
- "Where do you think you can improve?"

**2. Manager Assessment (20 min):**
- Acknowledge achievements with specific examples
- Discuss development areas with specific examples
- Use data: goal achievement %, project outcomes, peer feedback

**3. Forward-Looking Discussion (15 min):**
- "What do you want to work on next quarter?"
- "How can I support your development?"
- Agree on 2-3 development focus areas

**4. Wrap-Up (5 min):**
- Summarize key points
- Confirm next steps
- Document in writing (send follow-up email)

**Calibration:** Before finalizing reviews, managers should calibrate:
- Compare assessments across team
- Ensure consistency in standards
- Identify highest and lowest performers
- Pressure-test "exceeds expectations" and "below expectations" ratings

### Common Pitfalls

**The Recency Effect:** Remembering only the last month, not the full quarter/year. Solution: Keep running notes on each person.

**Avoiding Difficult Conversations:** Delaying feedback on underperformance is unfair to the person and damaging to the team.

**No Surprises Rule:** Performance review should contain zero surprises. If someone is underperforming, they should have heard that feedback in real-time.

**Stack Ranking/Forced Distribution:** "10% must be rated 'below expectations' regardless of performance" destroys trust and collaboration.

**Example:** Microsoft''s stack ranking created internal competition. Engineers would sabotage peers to avoid bottom 10%. System was abandoned.

**Tying Reviews Directly to Compensation:** When reviews directly determine bonus, people game the system:
- Sandbagging goals
- Hoarding credit
- Avoiding risky projects

**Better:** Reviews inform compensation, but also consider other factors (market data, company performance, budget).

**Manager Inconsistency:** Different managers using different standards creates perceptions of unfairness. Calibration meetings help.

**No Follow-Through:** Development plans that sit in a drawer are worthless. Schedule monthly check-ins on development goals.

### Application Example

**Case: Netflix''s Performance Culture**

**Philosophy:** "Adequate performance gets a generous severance."

**Key Practices:**

**1. Keeper Test:**
Managers regularly ask: "If this person resigned, would I fight to keep them?"
- Yes → Great, invest in their growth
- No → Have honest conversation, likely part ways

**2. Context, Not Control:**
- Set clear goals and context
- Give employees freedom to execute
- Assess outcomes, not process

**3. Radical Transparency:**
- 360-degree feedback is routine, not annual
- Feedback is direct: "What should I stop/start/continue?"
- Results shared openly in team meetings

**4. No Brilliant Jerks:**
- High performance doesn''t excuse toxic behavior
- Culture fit is non-negotiable
- "Brilliant jerk" damages team more than individual contributes

**Example Scenario:**

**Situation:** Star engineer who ships high-quality code but is condescending in code reviews, making other engineers afraid to contribute.

**Traditional Company Response:** Tolerate behavior because they''re productive.

**Netflix Response:** Direct feedback: "Your technical contributions are excellent, but your code review comments are damaging team morale. This must change immediately."

If behavior doesn''t improve → Performance improvement plan → Exit.

**Result:** Teams where psychological safety and high performance coexist.

**Controversial Aspect:** Netflix''s high bar and frequent turnover isn''t for everyone. Critics say it creates anxiety. Supporters say it creates excellence.

**Key Lesson:** Performance management must align with company culture and values. Netflix''s system works for them because it''s consistent with their "high performance culture" values. The same system at a family-oriented company would fail.

**Your job:** Design a performance system that reinforces your desired culture.',
'published');


