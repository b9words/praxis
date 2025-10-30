---
title: "KPIs & Dashboards: Performance Measurement Systems"
competency: "22222222-2222-2222-2222-222222222245"
domain: "Operational Management"
year: 1
order: 12
status: "published"
---

### Core Principle

**"What gets measured gets managed."** - Peter Drucker

KPIs (Key Performance Indicators) are the vital signs of your business. Dashboards make those metrics visible, actionable, and aligned across teams. Without clear metrics, you're flying blind; with too many, you're drowning in data.

**The art is selecting the RIGHT metrics** that drive behavior toward strategic goals.

**Why This Matters:**
- **Alignment**: Everyone knows what success looks like
- **Early Warning**: Problems surface before becoming crises
- **Accountability**: Clear ownership of outcomes
- **Decision-Making**: Data-driven vs. gut-feel
- **Motivation**: Teams rally around visible progress

**The Trap**: Measuring everything measures nothing. Focus on the vital few, not trivial many.

### The Framework / Model

#### **CHARACTERISTICS OF GOOD KPIs**

**SMART Metrics:**
```
Specific: Clearly defined, no ambiguity
Measurable: Quantifiable (not subjective)
Achievable: Realistic given resources
Relevant: Tied to strategic goals
Time-Bound: Tracked over defined periods
```

**Leading vs. Lagging Indicators:**

**Lagging Indicators** (Outcomes - What Happened)
```
Revenue, profit, customer satisfaction
  - Tell you results
  - But too late to change them
  - Historical data

Example: Quarterly revenue
  - Measures outcome
  - Can't improve until next quarter
```

**Leading Indicators** (Drivers - What Will Happen)
```
Pipeline, website traffic, sales calls
  - Predict future outcomes
  - Actionable in real-time
  - Can course-correct

Example: Sales pipeline value
  - Predicts future revenue
  - Can increase activity now
```

**Balance: Use BOTH**
```
Lagging: Did we hit the goal?
Leading: Are we on track to hit it?

Example SaaS Company:
  Lagging: Monthly Recurring Revenue (MRR)
  Leading: Free trial sign-ups, trial-to-paid conversion rate

If conversion rate drops → MRR will drop next month (but you can act now)
```

#### **KPI FRAMEWORKS BY FUNCTION**

**Sales KPIs:**
```
LEADING INDICATORS:
- Pipeline value (3-4x quota coverage)
- Number of qualified leads
- Sales activities (calls, emails, demos per rep)
- Average deal size
- Sales cycle length

LAGGING INDICATORS:
- Revenue (actual bookings)
- Win rate (%)
- Customer acquisition cost (CAC)
- Quota attainment (% of reps hitting)

RED FLAGS:
- Pipeline shrinking (future revenue risk)
- Win rate declining (competitive pressure)
- Sales cycle lengthening (deals getting stuck)
```

**Marketing KPIs:**
```
LEADING INDICATORS:
- Website traffic
- Lead generation (MQLs - Marketing Qualified Leads)
- Conversion rates (visitor → lead → MQL)
- Cost per lead
- Email engagement rates

LAGGING INDICATORS:
- Marketing-sourced revenue
- Return on Ad Spend (ROAS)
- Brand awareness scores
- Customer Lifetime Value (LTV)

RED FLAGS:
- Cost per lead increasing (efficiency declining)
- Lead quality declining (MQL → SQL conversion dropping)
- Traffic up but conversions flat (funnel problem)
```

**Product/Engineering KPIs:**
```
LEADING INDICATORS:
- Sprint velocity (story points per sprint)
- Code deployment frequency
- Feature adoption rate (% users using new features)
- Bug resolution time

LAGGING INDICATORS:
- Product performance (uptime, latency)
- Technical debt (code quality scores)
- NPS (Net Promoter Score)
- Feature usage depth

RED FLAGS:
- Velocity declining (team slowing down)
- Deployment frequency dropping (risk aversion)
- Bug backlog growing (quality suffering)
```

**Customer Success KPIs:**
```
LEADING INDICATORS:
- Customer health score (engagement, usage)
- Support ticket volume and severity
- Product adoption metrics
- Customer satisfaction (CSAT) scores

LAGGING INDICATORS:
- Churn rate (logo and revenue)
- Net Revenue Retention (NRR)
- Expansion revenue (upsells/cross-sells)
- Customer Lifetime Value (CLTV)

RED FLAGS:
- Health scores declining (churn coming)
- Ticket volume increasing (product issues)
- NRR < 100% (losing revenue from existing customers)
```

**Finance/Operations KPIs:**
```
LEADING INDICATORS:
- Cash runway (months of cash remaining)
- Accounts Receivable aging (payment delays)
- Burn rate trend
- Headcount vs. plan

LAGGING INDICATORS:
- Revenue, EBITDA, Net Income
- Gross margin, Operating margin
- CAC Payback Period
- Working capital

RED FLAGS:
- Burn rate increasing (runway shortening)
- AR aging increasing (collection issues)
- Margins compressing (unit economics worsening)
```

#### **THE NORTH STAR METRIC**

**Definition**: Single metric that best captures core value delivered to customers

**Characteristics:**
- Leads to revenue (not vanity metric)
- Reflects customer value delivered
- Measurable and trackable
- Everyone rallies around it

**Examples:**

| Company | North Star Metric | Why It Works |
|---------|-------------------|--------------|
| **Airbnb** | Nights Booked | Core transaction, leads to revenue, reflects value |
| **Facebook** | Daily Active Users (DAU) | Engagement drives ad revenue |
| **Slack** | Messages Sent | Usage depth = stickiness = retention |
| **Spotify** | Time Listening | Engagement = subscription retention |
| **Uber** | Rides per Week | Core transaction volume |
| **Amazon** | Purchases per Month | Buying frequency = customer value |

**North Star vs. Vanity Metrics:**
```
VANITY (Bad):
- App downloads (don't use it = worthless)
- Registered users (inactive users = no value)
- Page views (bots, accidental clicks)

NORTH STAR (Good):
- Active usage of core feature
- Transactions that generate revenue
- Repeat behavior (not one-time)
```

### Common Pitfalls

#### **1. Too Many Metrics (Analysis Paralysis)**

**The Trap**: Dashboard with 50 metrics

**Example:**
```
Executive Dashboard:
- 12 sales metrics
- 15 marketing metrics
- 20 product metrics
- 8 finance metrics
- Total: 55 KPIs

Problem:
- No one looks at all 55
- No clear priorities
- Can't tell if business is healthy at a glance
```

**Solution: The Rule of 3-5-7**
```
Executive Level: 3-5 company-wide KPIs
Department Level: 5-7 functional KPIs  
Team Level: 5-7 team-specific KPIs

Example SaaS Executive Dashboard:
1. MRR Growth Rate (%)
2. Net Revenue Retention (NRR)
3. CAC Payback Period (months)
4. Burn Multiple ($ burned / $ ARR added)
5. Net Promoter Score (NPS)

That's it. Everything else is supporting detail.
```

#### **2. Optimizing for the Wrong Metric**

**The Trap**: Metric becomes the goal, not the underlying objective

**Example: Wells Fargo Cross-Selling Scandal**
```
Metric: Cross-sell ratio (accounts per customer)
Target: 8 accounts per customer

What Happened:
- Employees opened fake accounts to hit targets
- Customers didn't know/consent
- Metric looked great, customers harmed
- $3B fine, CEO resigned

Lesson: Metric optimization without ethics = disaster
```

**Example: Amazon Delivery Driver Metrics**
```
Metric: Packages delivered per hour
Target: 45 packages/hour

Unintended Consequences:
- Drivers speeding (safety risk)
- Peeing in bottles (no bathroom breaks)
- Throwing packages (damaging goods)
- Ignoring "deliver to person" instructions

Better Metric: Successful deliveries (on-time, undamaged, customer-verified)
```

**Goodhart's Law**: "When a measure becomes a target, it ceases to be a good measure."

#### **3. Lagging Indicators Only (Rearview Driving)**

**The Trap**: Only measuring outcomes, not drivers

**Example: Retail Store**
```
Dashboard:
- Daily sales revenue ✓ (lagging)
- Monthly profit ✓ (lagging)
- Inventory turnover ✓ (lagging)

Missing Leading Indicators:
- Foot traffic (predicts sales)
- Conversion rate (visitors who buy)
- Average items per cart (basket size)

Problem: By the time sales drop, you've lost the day. No time to react.
```

**Better Approach:**
```
Leading + Lagging Combo:
- Foot traffic (hourly) → If low by 11am, activate promotions
- Conversion rate (real-time) → If low, staff greeting customers?
- Sales (daily) → Outcome check

Proactive vs. Reactive
```

#### **4. Data Without Action (Dashboards as Art)**

**The Trap**: Beautiful dashboards that no one acts on

**Example:**
```
Company invests $100K in BI tool
  - Creates 20 beautiful dashboards
  - Monthly executive review
  - Everyone nods at data
  - No decisions made
  - No process changes

Result: Expensive wallpaper
```

**Solution: Metrics Must Have Owners and Actions**
```
For Each KPI:
  - Owner: Who is accountable?
  - Target: What is the goal?
  - Threshold: When do we intervene?
  - Action Plan: What do we do if red?

Example:
  KPI: Customer Churn Rate
  Owner: VP Customer Success
  Target: <3% monthly
  Threshold: >5% = red alert
  Action Plan: 
    - Review churned accounts
    - Identify patterns
    - Implement save campaigns
    - Improve onboarding
```

#### **5. Ignoring Context and Trends**

**The Trap**: Looking at single data points without context

**Example: E-commerce Conversion Rate**
```
Conversion Rate Today: 2.5%

Is this good or bad?
  - Depends on yesterday (was it 3%? 2%?)
  - Depends on last year same day (seasonality)
  - Depends on traffic source (paid ads convert better than organic)
  - Depends on device (mobile vs. desktop)

Single number = meaningless without context
```

**Better Approach:**
```
Show Trends:
  - Line chart (30-day trend)
  - Year-over-year comparison
  - Segmentation (by channel, device, etc.)
  - Benchmarks (industry average)

Now you can see:
  - Direction (up or down)
  - Seasonality (expected fluctuations)
  - Anomalies (sudden spikes/drops)
```

### Application Example

#### **Case Study: Tableau's Metrics Evolution**

**Phase 1: Vanity Metrics (Early Days)**
```
Metrics Tracked:
- Downloads of Tableau Desktop (free trial)
- Website visits
- Press mentions

Problem:
- Downloads ≠ paid customers
- No revenue correlation
- False sense of success
```

**Phase 2: Revenue Focus (Growth Phase)**
```
Key Metrics:
- Annual Recurring Revenue (ARR)
- New customers
- Average selling price (ASP)
- Sales rep quota attainment

Better: Focused on revenue
Problem: Not predictive, reactive
```

**Phase 3: Holistic Dashboard (Mature)**
```
FINANCIAL:
- ARR Growth Rate (%)
- Net Revenue Retention (NRR)
- Rule of 40 (Growth% + Profit%) 

SALES:
- Pipeline Coverage (4x quota)
- Win Rate (%)
- Sales Cycle (days)

CUSTOMER SUCCESS:
- Gross Retention (%)
- Net Promoter Score (NPS)
- Expansion Rate (%)

PRODUCT:
- DAU/MAU Ratio (stickiness)
- Feature Adoption Rate
- Time to First Value

Result: Leading + Lagging, Predictive + Outcome-Based
```

**Outcome:**
- $15B acquisition by Salesforce (2019)
- Market leader in BI/Analytics
- Data-driven culture enabled by clear metrics

#### **Case Study: HubSpot's "Westrum Metrics"**

**HubSpot's Approach: Metric Transparency**

**Rule: All metrics publicly visible to entire company**

**Core Metrics (Visible on TVs Throughout Office):**
```
CUSTOMER METRICS:
- Total Customers
- Customer Adds (this month)
- Customer Churn (%)
- NPS Score

REVENUE METRICS:
- Monthly Recurring Revenue (MRR)
- Average Revenue Per Customer (ARPC)
- Lifetime Value (LTV)
- Customer Acquisition Cost (CAC)

EMPLOYEE METRICS:
- Employee NPS (eNPS)
- Headcount
- Revenue per Employee
- Time to Fill Open Roles

PRODUCT METRICS:
- Weekly Active Users (WAU)
- Feature Adoption Rates
- Bugs in Production
- Page Load Times
```

**Benefits of Transparency:**
```
Alignment:
  - Everyone knows if company is winning or losing
  - Can't hide problems
  - Shared accountability

Motivation:
  - Teams see their impact on company metrics
  - Healthy competition between teams
  - Celebrate wins together

Trust:
  - Leadership doesn't hide bad news
  - Employees treated as adults
  - Creates ownership culture
```

**Challenges Addressed:**
```
Q: What if competitors see metrics?
A: Public company anyway, SEC filings disclose

Q: What if metrics are bad?
A: Transparency forces action, can't ignore

Q: Do employees get distracted checking metrics?
A: Initial curiosity, then becomes background

Q: What about confidential metrics?
A: Separate "leadership eyes only" dashboard for sensitive items
```

**Results:**
- $1.7B revenue (2023)
- 65%+ year-over-year growth (sustained)
- Culture of data-driven decision-making
- Low employee churn (engaged workforce)

**Lesson**: Metric transparency builds trust and accountability.

#### **Dashboard Design Best Practices**

**Executive Dashboard (60-Second Glance):**
```
Layout:
  [HEADER: Company Name, Date Range]
  
  [TOP: North Star Metric - BIG NUMBER]
  MRR: $10.2M (+12% MoM) ✓
  
  [4 QUADRANTS]
  Revenue:        Financial Health:
  - ARR Growth    - Burn Rate
  - NRR           - Runway
  
  Customer:       Team:
  - Churn Rate    - Headcount
  - NPS           - Open Roles
  
  [BOTTOM: Trends - 90-day line charts]

Principles:
  - Green/Yellow/Red color coding (status at a glance)
  - Sparklines (tiny charts) for quick trends
  - Comparison to prior period (+/- %)
  - Alerts for anything red
```

**Operational Dashboard (Daily Team Use):**
```
For Sales Team:

[PIPELINE HEALTH]
- Total Pipeline: $15M (Target: $12M) ✓
- Weighted Pipeline: $6M (3x monthly target) ⚠
- Average Deal Size: $75K
- Win Rate: 25%

[ACTIVITY METRICS]
- Calls This Week: 45 (Target: 50) ⚠
- Demos Scheduled: 12
- Proposals Sent: 8
- Closed Deals: 2 ($150K)

[FORECAST]
- Month-to-Date: $450K (Target: $2M)
- Projected End-of-Month: $1.8M ⚠
- Gap to Goal: $200K (requires 3 more deals)

[ACTIONS NEEDED]
⚠ Pipeline below 4x target - increase prospecting
⚠ Projected to miss monthly goal - accelerate 3 deals in pipeline
✓ Win rate on target

Principles:
  - Actionable (what to do, not just what happened)
  - Real-time (refreshes hourly)
  - Role-specific (sales sees sales, marketing sees marketing)
  - Alerts (notifications when thresholds crossed)
```

### Summary

**KPI Selection Framework:**

**Step 1: Define Strategic Goals**
```
What are we trying to achieve?
  - Grow revenue by 50%
  - Improve customer retention
  - Increase operational efficiency
```

**Step 2: Identify Success Metrics**
```
How do we measure success?
  - ARR, NRR, Gross Margin
  - Churn rate, NPS
  - Cost per transaction, automation rate
```

**Step 3: Determine Leading Indicators**
```
What predicts these outcomes?
  - Pipeline, conversion rates
  - Customer health scores, support ticket trends
  - Process cycle times, error rates
```

**Step 4: Set Targets and Thresholds**
```
What's the goal? When do we act?
  - Target: <3% monthly churn
  - Yellow: 3-5% (monitor)
  - Red: >5% (immediate action)
```

**Step 5: Assign Ownership**
```
Who is accountable for each metric?
  - CEO: Company-wide metrics
  - VP Sales: Revenue metrics
  - VP CS: Retention metrics
```

**Step 6: Build Dashboards**
```
Make metrics visible and actionable
  - Executive: 5 company KPIs
  - Functional: 7 department KPIs
  - Team: 5-7 team KPIs
```

**Golden Rules:**

1. **Less is More**: 5-7 metrics per dashboard
2. **Leading + Lagging**: Predict and measure outcomes
3. **Actionable**: Metrics must drive decisions
4. **Transparent**: Make visible to relevant stakeholders
5. **Contextualized**: Show trends, not just snapshots
6. **Owned**: Every metric has an accountable owner
7. **Reviewed**: Regular cadence (weekly/monthly)

**Dashboard Hierarchy:**

```
Executive Dashboard (Board/CEO)
  ├─ North Star Metric
  ├─ 4-5 Company KPIs
  └─ Strategic Initiatives Progress

Functional Dashboards (VPs)
  ├─ Department North Star
  ├─ 5-7 Functional KPIs
  └─ Team Performance

Team Dashboards (Managers/ICs)
  ├─ Team Goals
  ├─ 5-7 Team KPIs
  └─ Individual Contributions
```

**The Ultimate Goal**: Create a measurement system that aligns the organization, surfaces problems early, and drives continuous improvement toward strategic goals.

**Remember**: Dashboards are tools for decision-making, not wallpaper. If a metric doesn't drive action, remove it.


