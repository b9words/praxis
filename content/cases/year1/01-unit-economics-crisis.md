---
title: "The Unit Economics Crisis: SaaS Startup Burning Cash"
competency: ["11111111-1111-1111-1111-111111111114", "11111111-1111-1111-1111-111111111122"]
domain: "Foundational Financial Acumen"
year: 1
order: 1
status: "published"
difficulty: "intermediate"
estimated_time: "45-60 minutes"
---

## Case Brief

### Company Overview

**CloudSync, Inc.**
- **Industry**: B2B SaaS (Cloud Storage & Collaboration)
- **Founded**: 2021
- **Stage**: Series A ($10M raised, 18 months ago)
- **Location**: San Francisco, CA
- **Team Size**: 45 employees

**Your Role**: Finance & Operations Manager (reporting to CEO)

### The Situation

CloudSync has been growing rapidly in terms of customer acquisition, but the board is concerned about burn rate. The company raised $10M 18 months ago and has $3.2M remaining. At the current burn rate, the company has ~6 months of runway.

The CEO has tasked you with analyzing the unit economics and presenting recommendations to the board in 2 weeks. The founding team is split:

- **CEO (Sarah)**: "We need to grow faster to hit Series B metrics. Let's increase marketing spend."
- **CTO (Mike)**: "We're scaling too fast. Our infrastructure costs are out of control."
- **VP Sales (James)**: "Our sales team is crushing it. We just need more leads."

### Key Metrics (Current State)

**Financial Overview:**
```
Monthly Recurring Revenue (MRR): $180,000
Annual Run Rate (ARR): $2,160,000
Monthly Burn Rate: $550,000
Cash Remaining: $3,200,000
Runway: 5.8 months

Gross Margin: 42%
Net Margin: -306% (losing $3.06 for every $1 in revenue)
```

**Customer Acquisition:**
```
Total Customers: 360
Monthly New Customers: 45
Average Deal Size: $500/month
Customer Acquisition Cost (CAC): $4,800
CAC Payback Period: 9.6 months
```

**Customer Economics:**
```
Lifetime Value (LTV): $7,200
LTV:CAC Ratio: 1.5:1
Churn Rate: 8% monthly (96% annual - very high!)
Average Customer Lifetime: 12.5 months
```

**Cost Breakdown (Monthly):**
```
Revenue: $180,000

Cost of Goods Sold (COGS):
  - AWS Infrastructure: $65,000 (36% of revenue)
  - Support Team (5 people): $40,000 (22% of revenue)
  Total COGS: $105,000
  Gross Profit: $75,000 (42% margin)

Operating Expenses:
  - Engineering (15 people): $300,000
  - Sales Team (10 people): $200,000
  - Marketing Spend: $80,000
  - G&A (HR, Finance, Office): $45,000
  Total OPEX: $625,000

Net Loss: -$550,000/month
```

## Data Files

### File 1: Customer Cohort Analysis (Last 12 Months)

```
Month    New Customers    MRR Added    Churn (%)    Net MRR Change
Jan 23   30               $15,000      5%           +$12,000
Feb 23   35               $17,500      6%           +$14,000
Mar 23   40               $20,000      7%           +$15,500
Apr 23   45               $22,500      7%           +$17,000
May 23   50               $25,000      8%           +$18,000
Jun 23   50               $25,000      8%           +$17,500
Jul 23   48               $24,000      9%           +$14,500
Aug 23   45               $22,500      8%           +$15,000
Sep 23   45               $22,500      9%           +$13,500
Oct 23   45               $22,500      8%           +$15,000
Nov 23   45               $22,500      8%           +$15,000
Dec 23   45               $22,500      8%           +$15,000

Observations:
- New customer acquisition has plateaued at ~45/month
- Churn has increased from 5% to 8% (red flag!)
- Net MRR growth slowing despite consistent acquisition
```

### File 2: Customer Segmentation Analysis

```
Segment        Customers    Avg MRR    Churn Rate    LTV        CAC      LTV:CAC
Small (1-10)   180 (50%)   $300       12%           $3,000     $3,500   0.86:1 ❌
Mid (11-50)    144 (40%)   $600       6%            $12,000    $5,000   2.4:1 ✓
Large (51+)    36 (10%)    $1,500     3%            $60,000    $8,000   7.5:1 ✓✓

Key Insights:
- Small customers are unprofitable (LTV < CAC)
- Mid customers are marginally profitable
- Large customers are highly profitable but only 10% of base
- Sales team spending equal effort on all segments
```

### File 3: Marketing Channel Performance

```
Channel              Monthly Spend    Customers    CAC      LTV:CAC    Payback
Google Ads           $30,000         15           $2,000   3.6:1      4 mo ✓
Content Marketing    $15,000         12           $1,250   5.8:1      2.5 mo ✓✓
Outbound Sales       $20,000         8            $2,500   2.9:1      5 mo ✓
Events/Conferences   $10,000         5            $2,000   3.6:1      4 mo ✓
Cold Calling         $5,000          5            $1,000   7.2:1      2 mo ✓✓

Observations:
- Content Marketing and Cold Calling have best ROI
- Outbound Sales expensive but brings larger deals
- Events have inconsistent results
```

### File 4: Infrastructure Cost Analysis

```
AWS Service          Monthly Cost    Usage         Cost/Customer
EC2 (Compute)        $25,000        80 instances   $69.44
S3 (Storage)         $18,000        500 TB         $50.00
RDS (Database)       $12,000        10 instances   $33.33
CloudFront (CDN)     $6,000         2 PB transfer  $16.67
Other Services       $4,000         Various        $11.11
Total                $65,000                       $180.56

Benchmark (Industry): $80-120/customer for similar SaaS
CloudSync: $180.56/customer (50-125% above benchmark!)

CTO's Notes:
- "We over-provisioned infrastructure for anticipated growth that didn't materialize"
- "Scaling architecture designed for 2,000 customers, only have 360"
- "Could optimize and cut costs by 40% but would require 2-3 months engineering time"
```

### File 5: Sales Team Performance

```
Sales Rep    Customers Closed    Avg Deal Size    Close Rate    Time to Close
Rep 1        8                   $750            15%           45 days
Rep 2        6                   $400            10%           60 days
Rep 3        7                   $650            12%           50 days
Rep 4        5                   $350            8%            70 days
Rep 5        4                   $300            7%            75 days
Rep 6        4                   $280            6%            80 days
Rep 7        3                   $250            5%            90 days
Rep 8        3                   $240            5%            95 days
Rep 9        3                   $220            4%            100 days
Rep 10       2                   $200            3%            110 days

Observations:
- Top 3 reps (30%) generate 47% of revenue
- Bottom 5 reps underperforming significantly
- No clear training or performance management system
- VP Sales: "We need to hire more reps to scale"
```

## Decision Points

### Decision Point 1: Immediate Action (Next 30 Days)

**Situation**: The board wants to see improved unit economics in 30 days or they'll push for a down-round or acquihire.

**What is your immediate priority?**

**Option A**: Cut costs aggressively (layoffs, reduce AWS spend)
- Lay off bottom 5 sales reps + reduce marketing by 50%
- Saves $150K/month, extends runway to 11 months
- Risk: May kill growth momentum, team morale crash

**Option B**: Focus on reducing churn (improve product/support)
- Reassign 3 engineers to product quality + onboarding improvements
- Hire 2 customer success managers
- Goal: Reduce churn from 8% to 4% within 90 days
- Short-term: Increases burn, reduces runway to 4.5 months

**Option C**: Optimize customer mix (focus on profitable segments)
- Stop acquiring small customers (<$500 MRR)
- Double down on mid/large segments
- Reallocate sales team to focus on larger deals
- Short-term: New customer count drops, but LTV:CAC improves

**Option D**: Raise bridge round immediately (buy time)
- Raise $3-5M bridge to extend runway
- Use time to fix unit economics
- Risk: Dilution, signaling weakness, may not succeed

**Your Recommendation:**
[Text area for student to write their decision and justification]

**Quantitative Analysis Required:**
- Calculate new burn rate for each option
- Project runway for each scenario
- Estimate impact on LTV:CAC ratio
- Break-even analysis

### Decision Point 2: Pricing Strategy (60 Days)

**Situation**: After analyzing the data, you realize pricing may be too low and not differentiated by segment.

**Current Pricing:**
```
Starter Plan: $300/month (1-10 users)
Growth Plan: $600/month (11-50 users)
Enterprise Plan: $1,500/month (51+ users)
```

**Customer Feedback:**
- 70% of Enterprise customers said they'd pay 50% more for better features
- Small customers complain about lack of features but won't pay more
- Mid-market customers are price-sensitive but value reliability

**What pricing change do you recommend?**

**Option A**: Raise prices across the board (+30%)
- Immediate MRR boost if customers stay
- Risk: Accelerate churn, especially in small segment
- Expected: 20% of customers churn, but net revenue positive

**Option B**: Introduce minimum ($500/month for all plans)
- Forces small customers to upgrade or churn
- Focuses company on profitable segments
- Expected: Lose 50% of small customers, improve margins

**Option C**: Add premium tier ($3,000/month with advanced features)
- Upsell current Enterprise customers
- Target new large customers
- Requires product development (3 months)

**Option D**: Value-based pricing (charge per GB stored)
- Aligns pricing with customer value
- Heavy users pay more, light users pay less
- Complex to implement, may confuse customers

**Your Recommendation:**
[Text area for student to write their decision and justification]

### Decision Point 3: Infrastructure Optimization (90 Days)

**Situation**: CTO Mike presents a plan to optimize infrastructure costs but requires significant engineering time.

**CTO's Proposal:**
```
Option 1: "Quick Wins" (3 weeks, 3 engineers)
  - Right-size EC2 instances (20% savings)
  - Implement S3 lifecycle policies (15% savings)
  - Optimize database queries (10% savings)
  Total Savings: $29,250/month (45% reduction)
  Cost: $60K in eng time (lost feature development)

Option 2: "Architectural Overhaul" (3 months, 5 engineers)
  - Migrate to serverless architecture
  - Implement multi-tenancy (shared resources)
  - Build internal caching layer
  Total Savings: $45,500/month (70% reduction)
  Cost: $300K in eng time + potential stability issues

Option 3: "Hybrid Approach" (6 weeks, 4 engineers)
  - Quick wins + some architectural improvements
  - Phased rollout (minimize risk)
  Total Savings: $35,750/month (55% reduction)
  Cost: $120K in eng time
```

**CEO Sarah's Concern**: "We're a product company, not an infrastructure company. We need features to win customers, not cost optimization."

**Do you proceed with infrastructure optimization?**

**Option A**: Yes, Option 1 (Quick Wins)
- Fast ROI (payback in 2 months)
- Low risk
- Frees up cash for growth

**Option B**: Yes, Option 2 (Architectural Overhaul)
- Best long-term solution
- Scales to 10,000+ customers
- High risk, long timeline

**Option C**: Yes, Option 3 (Hybrid)
- Balanced approach
- Good savings + some scalability
- Moderate risk

**Option D**: No, keep focus on product/growth
- Infrastructure costs will improve as revenue scales
- Don't distract engineering team
- Focus on features that reduce churn

**Your Recommendation:**
[Text area for student to write their decision and justification]

### Decision Point 4: Growth vs. Profitability (Final Recommendation)

**Situation**: You've implemented changes over 90 days. Board meeting is tomorrow. Present your strategic recommendation.

**Scenario After 90 Days (Assuming you optimized):**
```
Monthly Metrics:
  MRR: $240,000 (up from $180K)
  Churn: 5% (down from 8%)
  CAC: $3,600 (down from $4,800)
  LTV: $11,520 (up from $7,200)
  LTV:CAC: 3.2:1 (up from 1.5:1) ✓

Cost Structure:
  COGS: $85,000 (35% of revenue, improved)
  OPEX: $450,000 (reduced)
  Net Burn: $295,000/month (down from $550K)
  
Runway: 10.8 months (with $3.2M remaining)
```

**The Board's Question**: "Do we prioritize growth or profitability?"

**Path A: Growth Mode**
```
Strategy: Raise Series B ($20M) and accelerate growth
  - Hire aggressively (double team in 12 months)
  - Increase marketing spend 3x
  - Target: $10M ARR in 18 months
  - Goal: Market leadership, IPO trajectory
  
Requirements:
  - Must show 3x YoY growth
  - LTV:CAC stays above 3:1
  - Churn below 5%
```

**Path B: Profitability Mode**
```
Strategy: Reach cash-flow positive, no new funding
  - Maintain current team size
  - Organic growth only (no paid acquisition)
  - Target: $5M ARR in 24 months, profitable
  - Goal: Sustainable business, potential acquisition
  
Requirements:
  - Break-even in 12 months
  - Slower growth (acceptable)
  - Less competitive risk
```

**Path C: Hybrid Mode**
```
Strategy: Moderate growth, extend runway, raise when strong
  - Selective hiring (key roles only)
  - Efficient growth (optimize channels)
  - Target: $6M ARR in 18 months
  - Goal: Raise Series B from position of strength
  
Requirements:
  - 2x YoY growth
  - LTV:CAC above 3:1
  - Break-even in 18-24 months
```

**Your Final Recommendation to the Board:**
[Text area for comprehensive strategic recommendation]

**Required Deliverables:**
1. Financial model (3 scenarios, 24-month projection)
2. Key metrics to track monthly
3. Risk mitigation plan
4. Team communication plan
5. Board deck outline (5 slides)

## Evaluation Rubric

### Financial Analysis (30 points)
- **Accurate unit economics calculations** (10 pts)
- **Cash flow projections for each scenario** (10 pts)
- **ROI analysis for recommendations** (10 pts)

### Strategic Thinking (30 points)
- **Clear prioritization with rationale** (10 pts)
- **Risk assessment and mitigation** (10 pts)
- **Long-term vision alignment** (10 pts)

### Operational Judgment (20 points)
- **Realistic implementation timeline** (10 pts)
- **Resource allocation decisions** (10 pts)

### Communication (20 points)
- **Clear, concise recommendations** (10 pts)
- **Data-driven justification** (10 pts)

**Total: 100 points**

**Scoring:**
- 90-100: Exceptional - Ready for CFO/COO track
- 75-89: Strong - Solid operator, room to grow
- 60-74: Adequate - Needs improvement in strategic thinking
- <60: Needs Development - Review fundamentals

## AI Coach Prompts

**Persona: Linda Chen, Former COO at Stripe**

**Coaching Style**: Direct, data-driven, expects quantitative rigor

**Sample Dialogue:**

Student: "I think we should cut costs immediately."

Linda: "Cut what specifically? By how much? What's the impact on runway? Show me the numbers. I need to see your cash flow projection for 12 months under your proposal."

Student: "We'd cut the bottom 5 sales reps and reduce marketing by $40K."

Linda: "Okay, that saves $140K/month. But what happens to new customer acquisition? You're losing 5 reps who collectively closed 15 customers last quarter. Even if they're underperforming, that's still revenue. Did you model the revenue impact? What if those small customers were actually going to expand into your mid-tier segment? Have you looked at expansion rates?"

**Debrief Focus Areas:**
1. Did the student calculate actual numbers or make vague recommendations?
2. Did they consider second-order effects (cutting sales → less revenue)?
3. Did they balance short-term survival with long-term growth?
4. Did they present alternatives with quantified trade-offs?

## Expected Insights

Strong students will recognize:

1. **The root problem is not growth speed—it's unit economics**
   - LTV:CAC of 1.5:1 is unsustainable (need 3:1+)
   - High churn (8%) destroys LTV
   - Small customers are fundamentally unprofitable

2. **Multiple issues need simultaneous addressing**
   - Can't just cut costs (kills growth)
   - Can't just grow faster (makes problem worse)
   - Need: reduce churn + optimize customer mix + cut waste

3. **Churn is the silent killer**
   - At 8% monthly churn, average customer lasts 12.5 months
   - Reducing to 4% doubles LTV ($14,400 vs $7,200)
   - Churn improvement has biggest impact on unit economics

4. **Not all revenue is good revenue**
   - Small customers (50% of base) are unprofitable
   - Should focus on mid/large segments
   - Pricing may be too low for value delivered

5. **Infrastructure over-build is fixable but not the priority**
   - $29K/month savings nice but won't fix unit economics
   - Focus first on revenue quality, then costs

**The Winning Strategy**: Focus on reducing churn + optimizing customer mix + selective cost cuts, then raise Series B from position of strength (hybrid path).


