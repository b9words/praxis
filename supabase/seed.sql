-- Seed data for Execemy Platform MVP
-- This file contains the core competency framework, 3 articles, 3 case simulations, and default forum channels

-- Insert core competency domains and competencies
INSERT INTO public.competencies (id, name, description, parent_id, level) VALUES
  -- Core domains (level 1)
  ('11111111-1111-1111-1111-111111111111', 'Financial Acumen', 'Understanding and applying financial principles to business decisions', NULL, 'domain'),
  ('22222222-2222-2222-2222-222222222222', 'Strategic Thinking', 'Ability to formulate and execute long-term business strategy', NULL, 'domain'),
  ('33333333-3333-3333-3333-333333333333', 'Market Awareness', 'Understanding market dynamics, competition, and customer needs', NULL, 'domain'),
  ('44444444-4444-4444-4444-444444444444', 'Risk Management', 'Identifying, assessing, and mitigating business risks', NULL, 'domain'),
  ('55555555-5555-5555-5555-555555555555', 'Leadership Judgment', 'Making sound decisions and leading teams effectively', NULL, 'domain'),
  
  -- Financial Acumen sub-competencies
  ('11111111-1111-1111-1111-111111111112', 'Investment Analysis', 'Evaluating investment opportunities and returns', '11111111-1111-1111-1111-111111111111', 'competency'),
  ('11111111-1111-1111-1111-111111111113', 'Cost Management', 'Managing operational and capital expenditures', '11111111-1111-1111-1111-111111111111', 'competency'),
  
  -- Financial Acumen micro-skills
  ('11111111-1111-1111-1111-111111111114', 'ROI & CAC Calculation', 'Calculate and interpret ROI and Customer Acquisition Cost', '11111111-1111-1111-1111-111111111112', 'micro_skill'),
  ('11111111-1111-1111-1111-111111111115', 'OPEX vs CAPEX', 'Distinguish between and manage operational and capital expenses', '11111111-1111-1111-1111-111111111113', 'micro_skill'),
  
  -- Strategic Thinking sub-competencies
  ('22222222-2222-2222-2222-222222222223', 'Innovation Strategy', 'Developing strategies for innovation and disruption', '22222222-2222-2222-2222-222222222222', 'competency'),
  
  -- Strategic Thinking micro-skills
  ('22222222-2222-2222-2222-222222222224', 'Innovator''s Dilemma', 'Understanding and navigating disruptive innovation', '22222222-2222-2222-2222-222222222223', 'micro_skill');

-- Insert 3 foundational articles
INSERT INTO public.articles (id, competency_id, title, content, status) VALUES
  -- Article 1: ROI & CAC
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111114', 'Framework: Return on Investment (ROI) & Customer Acquisition Cost (CAC)', 
  '### Core Principle

Return on Investment (ROI) and Customer Acquisition Cost (CAC) are two fundamental metrics that every business leader must master. ROI measures the efficiency of an investment by comparing the gain from an investment to its cost. CAC measures how much it costs to acquire a new customer, including all marketing and sales expenses.

These metrics are critical because they determine whether your business model is sustainable. A company might be growing rapidly in terms of customer count, but if the CAC is higher than the lifetime value (LTV) of those customers, the business is fundamentally unprofitable.

### The Framework / Model

**ROI Calculation:**
```
ROI = (Net Profit / Cost of Investment) × 100%
```

For example, if you invest $10,000 in a marketing campaign and generate $15,000 in profit, your ROI is:
```
ROI = ($15,000 - $10,000) / $10,000 × 100% = 50%
```

**CAC Calculation:**
```
CAC = Total Sales & Marketing Costs / Number of New Customers Acquired
```

If you spend $100,000 on sales and marketing in a quarter and acquire 500 new customers:
```
CAC = $100,000 / 500 = $200 per customer
```

**The LTV:CAC Ratio:**
A healthy business typically aims for an LTV:CAC ratio of at least 3:1. This means the lifetime value of a customer should be at least three times what it costs to acquire them.

### Common Pitfalls

- **Sunk Cost Fallacy:** Continuing to invest in a project because of past investment, rather than evaluating future returns objectively.
- **Ignoring Time Value of Money:** Not accounting for when returns will be realized. A 50% ROI over 5 years is very different from 50% ROI over 1 year.
- **Cherry-Picking Time Periods:** Calculating CAC only during your best-performing months rather than averaging over a full business cycle.
- **Incomplete Cost Attribution:** Failing to include all costs (overhead, tool subscriptions, salaries) in CAC calculations.

### Application Example

**Case: SaaS Startup Evaluation**

A SaaS company has the following metrics:
- Monthly marketing spend: $50,000
- Monthly sales team cost: $30,000
- New customers acquired per month: 200
- Average customer lifetime value: $1,200
- Average monthly revenue per customer: $100

**Analysis:**
```
CAC = ($50,000 + $30,000) / 200 = $400
LTV:CAC Ratio = $1,200 / $400 = 3:1
```

This is right at the healthy threshold. However, if the company plans to scale marketing by 3x, they need to ensure CAC doesn''t increase disproportionately. They should also calculate the payback period:
```
Payback Period = $400 / $100 = 4 months
```

This means it takes 4 months to recoup the customer acquisition cost, which is reasonable for a SaaS business.', 
  'published'),

  -- Article 2: The Innovator''s Dilemma
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaabb', '22222222-2222-2222-2222-222222222224', 'Framework: The Innovator''s Dilemma', 
  '### Core Principle

The Innovator''s Dilemma, introduced by Clayton Christensen, explains why successful companies often fail when faced with disruptive innovation. The paradox is that the very management practices that make companies successful in the present—listening to customers, investing in the most profitable products, and focusing on core competencies—can lead to their downfall when disruptive technologies emerge.

Disruptive innovations typically start by serving a niche market with a "worse" product (on traditional metrics) that is cheaper, simpler, or more convenient. Incumbent companies rationally ignore these innovations because their best customers don''t want them. By the time the disruptive technology improves enough to serve the mainstream market, it''s too late for the incumbent to catch up.

### The Framework / Model

**Types of Innovation:**

1. **Sustaining Innovation:** Improves existing products along the dimensions that mainstream customers value. Incumbents usually win here.

2. **Disruptive Innovation:** Creates a new market or value network, eventually displacing established market leaders. Two types:
   - **Low-end disruption:** Targets over-served customers with a "good enough" cheaper product
   - **New-market disruption:** Creates an entirely new category of customers

**The Disruption Process:**

```
1. Established firms improve products (sustaining innovation)
   ↓
2. They overshoot customer needs
   ↓
3. Disruptor enters with simpler/cheaper product
   ↓
4. Incumbents ignore it (rational, since best customers don''t want it)
   ↓
5. Disruptor improves and moves upmarket
   ↓
6. Incumbent loses market share and struggles to respond
```

### Common Pitfalls

- **Listening Only to Current Best Customers:** Your best customers today will not tell you about disruptive opportunities, because they don''t want inferior products.
- **Resource Allocation to Highest ROI:** Disruptive innovations often have lower initial ROI and smaller markets, so they lose in resource allocation processes.
- **Waiting for the Technology to Mature:** By the time the disruptive technology is "good enough," the incumbent has lost the critical window to respond.
- **Trying to Cram Disruption into Existing Processes:** Disruptive innovations often require different cost structures and business models that don''t fit the parent organization.

### Application Example

**Case: Netflix vs. Blockbuster**

In the early 2000s, Netflix was a disruptive innovation to Blockbuster''s video rental business:

- **Blockbuster''s strengths:** Convenient locations, large selection, instant gratification
- **Netflix''s initial offering:** Mail-order DVDs (worse on convenience, no instant gratification)
- **Netflix''s advantages:** No late fees, cheaper, larger total selection

**Why Blockbuster Failed to Respond:**

1. Their best customers (frequent renters in urban areas) didn''t want mail-order DVDs
2. Late fees were a significant profit center (rational to keep them)
3. Investing in mail-order would cannibalize store revenue
4. The initial market for mail-order was small (low ROI)

By the time streaming technology emerged (another disruption), Netflix had already built the customer base, brand, and technology infrastructure to dominate. Blockbuster filed for bankruptcy in 2010.

**Key Lesson:** The disruption wasn''t just about technology (DVD-by-mail, then streaming). It was about a business model that served over-looked customer needs (people who hated late fees and wanted convenience at home).', 
  'published'),

  -- Article 3: OPEX vs CAPEX
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaac3', '11111111-1111-1111-1111-111111111115', 'Framework: OPEX vs. CAPEX', 
  '### Core Principle

Operating Expenses (OPEX) and Capital Expenditures (CAPEX) are two fundamental categories of business spending that have profoundly different implications for a company''s financial health, tax obligations, and strategic flexibility.

**OPEX** represents the day-to-day costs of running a business—salaries, rent, utilities, marketing spend, software subscriptions. These expenses are fully deducted from revenue in the period they occur.

**CAPEX** represents investments in long-term assets—buildings, equipment, major technology infrastructure. These costs are capitalized (added to the balance sheet as assets) and then depreciated over time.

Understanding the distinction is critical because the choice between OPEX and CAPEX affects cash flow, profitability metrics, and financial flexibility.

### The Framework / Model

**OPEX Characteristics:**
- Fully expensed in the current period
- Appears on the income statement
- Reduces taxable income immediately
- No asset created on the balance sheet
- Examples: Salaries, rent, SaaS subscriptions, advertising

**CAPEX Characteristics:**
- Capitalized and depreciated over multiple years
- Creates an asset on the balance sheet
- Tax benefit spread over the useful life of the asset
- Often requires large upfront cash outlay
- Examples: Real estate, manufacturing equipment, major software implementations

**Impact on Financial Metrics:**

```
EBITDA (Earnings Before Interest, Tax, Depreciation, Amortization)
= Revenue - OPEX

Net Income = EBITDA - Depreciation - Interest - Tax

Free Cash Flow = Net Income + Depreciation - CAPEX
```

### Common Pitfalls

- **Confusing Accounting Treatment with Cash Flow:** Just because CAPEX is depreciated over time doesn''t mean you didn''t spend the cash upfront.
- **OPEX Inflation in SaaS Era:** Cloud services shift CAPEX (owning servers) to OPEX (renting compute). This can make companies look less profitable on EBITDA metrics.
- **Ignoring Total Cost of Ownership (TCO):** A cheaper OPEX option (e.g., renting equipment) might cost more over 5 years than the CAPEX option (buying).
- **Strategic Flexibility vs. Balance Sheet:** OPEX provides more flexibility (you can cancel subscriptions), but CAPEX can look better to investors (asset accumulation).

### Application Example

**Case: Startup Cloud Infrastructure Decision**

A growing startup needs to decide between two infrastructure approaches:

**Option A: On-Premise (CAPEX Heavy)**
- Upfront cost: $500,000 for servers and data center setup
- Annual maintenance: $50,000 (OPEX)
- Depreciated over 5 years
- Year 1 P&L impact: $150,000 ($100,000 depreciation + $50,000 maintenance)
- Year 1 cash outflow: $550,000

**Option B: Cloud Services (OPEX Heavy)**
- No upfront cost
- Monthly cost: $15,000 ($180,000/year)
- Year 1 P&L impact: $180,000
- Year 1 cash outflow: $180,000

**Analysis:**

*From a P&L perspective:* Option A looks better in year 1 ($150k expense vs. $180k).

*From a cash flow perspective:* Option B is far superior in year 1 ($180k vs. $550k).

*From a strategic flexibility perspective:* Option B wins decisively. If the startup''s needs change, they can scale up or down monthly. Option A locks them into infrastructure that might become obsolete.

*From a 5-year TCO perspective:*
- Option A total cost: $500k + (5 × $50k) = $750k
- Option B total cost: 5 × $180k = $900k

**Decision:** For a startup prioritizing cash preservation and flexibility, Option B (cloud/OPEX) is almost always the right choice, despite the higher 5-year cost. For a mature company with predictable infrastructure needs and strong cash position, Option A might make sense.', 
  'published');

-- Insert 3 case simulations
INSERT INTO public.cases (id, title, briefing_doc, datasets, rubric, status) VALUES
  -- Case 1: The Growth Engine Challenge
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'The Growth Engine Challenge', 
  '#### The Scenario

You are the newly appointed Chief Strategy Officer at **GrowthFlow**, a 3-year-old B2B SaaS company that provides workflow automation tools for mid-market companies. The company has grown to $10M ARR (Annual Recurring Revenue) but growth has stalled at 20% YoY, down from 100%+ in year 1.

The CEO has tasked you with diagnosing the growth problem and recommending a path to re-accelerate growth to 50%+ YoY. You have $2M in available budget to deploy over the next 12 months.

#### Your Role

As Chief Strategy Officer, you must:
1. Analyze the current customer acquisition funnel and economics
2. Identify the primary bottleneck to growth
3. Propose a specific, data-driven plan to deploy the $2M budget
4. Justify your recommendation with ROI projections

You will present your findings to the CEO (an AI persona) who is skeptical of increased marketing spend without clear ROI.

#### Key Stakeholders

**Sarah Chen - CEO & Founder**
- Background: Former product manager at a major tech company
- Priorities: Sustainable growth, capital efficiency, product-led growth
- Concerns: Worried that increased marketing spend will hurt unit economics
- Bias: Strong preference for organic/viral growth over paid acquisition

**Mike Rodriguez - Head of Sales**
- Argues that the problem is lead quality, not quantity
- Wants to hire 3 more sales reps ($300k total cost)
- Claims current leads from marketing have <5% close rate

#### The Decision Point(s)

**Decision 1: Diagnosis**
Based on the financial data provided, what is the primary bottleneck to growth?
a) Not enough marketing spend (top of funnel problem)
b) Poor lead quality / conversion (middle of funnel problem)  
c) High churn rate (retention problem)
d) Product-market fit issues (fundamental problem)

**Decision 2: Budget Allocation**
How would you deploy the $2M budget? Provide specific allocations and justify each with expected ROI.

**Decision 3: CEO Negotiation**
You will need to convince Sarah (AI CEO) that your plan is the right approach. Be prepared to defend your numbers and address her concerns about capital efficiency.',
  
  -- Datasets for the case
  '{ 
    "financials": {
      "arr": 10000000,
      "monthly_revenue": 833333,
      "growth_rate_yoy": 0.20,
      "cash_runway_months": 18
    },
    "customer_metrics": {
      "total_customers": 400,
      "average_contract_value": 25000,
      "customer_lifetime_months": 36,
      "monthly_churn_rate": 0.03,
      "ltv": 75000
    },
    "acquisition_funnel": {
      "monthly_marketing_spend": 100000,
      "monthly_sales_team_cost": 150000,
      "website_visitors_per_month": 50000,
      "trial_signups_per_month": 500,
      "sales_qualified_leads_per_month": 100,
      "closed_deals_per_month": 8,
      "visitor_to_trial_rate": 0.01,
      "trial_to_sql_rate": 0.20,
      "sql_to_close_rate": 0.08
    },
    "calculated_metrics": {
      "cac": 31250,
      "ltv_to_cac_ratio": 2.4,
      "months_to_payback": 15
    }
  }',
  
  -- Rubric for AI evaluation
  '{
    "criteria": [
      {
        "competencyName": "Financial Acumen",
        "description": "Evaluates the candidate''s ability to correctly calculate and interpret CAC, LTV, and ROI metrics",
        "scoringGuide": {
          "1": "Failed to calculate CAC or LTV correctly, or made fundamental errors in financial reasoning",
          "2": "Calculated basic metrics correctly but missed important nuances (e.g., payback period, didn''t account for churn impact)",
          "3": "Correctly calculated all core metrics (CAC, LTV, ROI) and used them to inform decision, but analysis lacked depth",
          "4": "Strong financial analysis including CAC, LTV, ROI, payback period, and used sensitivity analysis to test assumptions",
          "5": "Exceptional financial modeling that identified non-obvious insights (e.g., the marginal CAC of the next customer cohort, contribution margin analysis)"
        }
      },
      {
        "competencyName": "Strategic Thinking",
        "description": "Evaluates the quality of the diagnosis and the strategic coherence of the proposed solution",
        "scoringGuide": {
          "1": "Misdiagnosed the core problem or proposed a solution that doesn''t address root cause",
          "2": "Identified a problem but proposed a superficial or incomplete solution",
          "3": "Correctly identified the primary bottleneck (middle of funnel conversion) and proposed a reasonable solution",
          "4": "Strong diagnosis with a well-structured solution addressing multiple leverage points in the funnel",
          "5": "Exceptional strategic thinking: identified that the 8% SQL-to-close rate is the key bottleneck, proposed specific improvements (sales training, lead scoring, demo optimization) with projected impact"
        }
      },
      {
        "competencyName": "Risk Management",
        "description": "Evaluates how well the candidate identified and mitigated risks in their proposal",
        "scoringGuide": {
          "1": "Ignored obvious risks or made unrealistic assumptions without acknowledging uncertainty",
          "2": "Acknowledged some risks but didn''t propose mitigation strategies",
          "3": "Identified key risks and proposed at least one mitigation strategy",
          "4": "Comprehensive risk analysis with specific mitigation plans for each major risk",
          "5": "Exceptional risk management: included fallback plans, defined success metrics with kill criteria, and proposed a phased rollout to limit downside"
        }
      }
    ]
  }',
  'published'),

  -- Case 2: The Innovation & Disruption Challenge  
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'The Innovation & Disruption Challenge',
  '#### The Scenario

You are the VP of Strategy at **MarketLeader Corp**, a publicly-traded $500M revenue company that has dominated the project management software space for 15 years. Your product is feature-rich, used by 80% of Fortune 500 companies, and has 45% profit margins.

However, in the past 18 months, a new startup called **SimpleFlow** has emerged. Their product has 1/10th the features of yours, but it''s drastically easier to use and costs $10/user/month vs. your $50/user/month. They''ve signed 2,000 customers, mostly small businesses and teams at larger companies who are using SimpleFlow as "shadow IT."

The CEO has called an emergency strategy meeting. Some executives want to ignore SimpleFlow ("They''re not even in our market"), others want to acquire them, and others want to build a competing simple product.

#### Your Role

As VP of Strategy, you must:
1. Assess whether SimpleFlow represents a genuine disruptive threat
2. Recommend a strategic response
3. Convince the executive team of your recommendation

#### Key Stakeholders

**David Park - CEO**
- Concerned about stock price impact
- Risk-averse, wants to protect the core business
- Skeptical of "startup hype"

**Jennifer Walsh - Chief Product Officer**
- Argues that SimpleFlow''s simplicity is a weakness, not a strength  
- Wants to add even more features to MarketLeader
- Believes enterprise customers would never switch to an inferior product

**Tom Anderson - CFO**
- Focused on maintaining 45% margins
- Concerned that building a low-cost product would cannibalize existing revenue
- Open to acquiring SimpleFlow if the price is right (they want $200M)

#### The Decision Point(s)

**Decision 1: Threat Assessment**
Is SimpleFlow a disruptive threat? Justify your answer using the Innovator''s Dilemma framework.

**Decision 2: Strategic Response**
Choose and justify your recommended strategy:
a) Ignore SimpleFlow and focus on serving enterprise customers better
b) Acquire SimpleFlow for $200M
c) Build a separate "MarketLeader Lite" product
d) Reduce prices and add "simple mode" to the existing product

**Decision 3: Executive Persuasion**
You must convince the CPO (AI persona) who believes SimpleFlow is not a threat. She will challenge your reasoning.',
  
  '{ 
    "market_data": {
      "total_addressable_market": 50000000000,
      "marketleader_revenue": 500000000,
      "marketleader_market_share": 0.35,
      "simpleflow_revenue": 24000000,
      "simpleflow_growth_rate_yoy": 3.5,
      "average_enterprise_deal_size": 100000,
      "average_smb_deal_size": 2000
    },
    "customer_data": {
      "marketleader_customers": 5000,
      "marketleader_nps": 45,
      "simpleflow_customers": 2000,
      "simpleflow_nps": 78,
      "marketleader_churn_rate": 0.08,
      "simpleflow_churn_rate": 0.05
    },
    "product_comparison": {
      "marketleader_features": 450,
      "simpleflow_features": 35,
      "marketleader_time_to_value_days": 90,
      "simpleflow_time_to_value_days": 1,
      "marketleader_setup_complexity": "Requires IT involvement, 2-week implementation",
      "simpleflow_setup_complexity": "Self-serve, 5-minute signup"
    }
  }',
  
  '{
    "criteria": [
      {
        "competencyName": "Strategic Thinking",
        "description": "Evaluates understanding of the Innovator''s Dilemma and quality of strategic reasoning",
        "scoringGuide": {
          "1": "Failed to recognize SimpleFlow as a disruptive threat or misapplied the framework",
          "2": "Recognized disruption but analysis was superficial or incomplete",
          "3": "Correctly identified SimpleFlow as a classic low-end disruptive threat with reasonable justification",
          "4": "Strong application of Innovator''s Dilemma framework, identifying specific signals (high NPS, low churn, rapid growth in over-looked segment)",
          "5": "Exceptional analysis: identified that SimpleFlow exhibits classic disruption patterns AND recognized the ''jobs to be done'' mismatch (MarketLeader is over-serving on features, under-serving on ease of use)"
        }
      },
      {
        "competencyName": "Risk Management", 
        "description": "Evaluates the candidate''s ability to weigh strategic options and their associated risks",
        "scoringGuide": {
          "1": "Chose a high-risk option without acknowledging downsides, or recommended inaction despite clear threat",
          "2": "Identified some risks but failed to adequately weigh trade-offs between options",
          "3": "Reasonable risk assessment of different strategic options with some justification",
          "4": "Thorough analysis of risks and benefits of each option, with clear reasoning for final recommendation",
          "5": "Exceptional risk management: recommended building a separate business unit (avoiding cannibalization and cost structure conflicts), with specific governance to prevent parent company from killing it"
        }
      },
      {
        "competencyName": "Leadership Judgment",
        "description": "Evaluates the candidate''s ability to navigate organizational politics and convince skeptical stakeholders",
        "scoringGuide": {
          "1": "Failed to address stakeholder concerns or used weak arguments in the negotiation",
          "2": "Made some valid points but didn''t effectively counter the CPO''s objections",
          "3": "Presented a coherent case with evidence, addressing at least one of the CPO''s concerns",
          "4": "Strong persuasion: used data and framework to systematically address objections, acknowledged valid concerns while making the case for action",
          "5": "Exceptional leadership: reframed the conversation from ''SimpleFlow is a threat'' to ''We have an opportunity to serve a high-growth segment we''ve been ignoring,'' turning a defensive conversation into an offensive strategy"
        }
      }
    ]
  }',
  'published'),

  -- Case 3: The Operational Efficiency Challenge
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'The Operational Efficiency Challenge',
  '#### The Scenario

You are the COO of **CloudManufacture Inc**, a hardware company that makes IoT sensors for industrial applications. The company is profitable but facing margin pressure from Chinese competitors. 

The CEO wants to improve operational efficiency by 20% to maintain margins without raising prices. You''ve identified two major opportunities:

1. **Automate the production line** (CAPEX-heavy approach)
2. **Migrate to cloud-based manufacturing tools** (OPEX-heavy approach)

You have a $1.5M budget and need to make a recommendation to the board.

#### Your Role

As COO, you must:
1. Analyze the financial impact of each approach
2. Consider strategic implications beyond pure financials
3. Make a recommendation that balances short-term cash flow with long-term efficiency
4. Present your case to the CFO (AI persona) who is skeptical of large capital expenditures

#### Key Stakeholders

**Lisa Thompson - CFO**
- Conservative financial approach
- Concerned about cash flow and balance sheet
- Wants to minimize risk and maintain financial flexibility
- Skeptical of long payback periods

**Marcus Chen - VP of Manufacturing**  
- Prefers the automation approach (CAPEX)
- Argues that owning assets gives more control
- Worried about relying on external cloud vendors
- Believes 5-year TCO favors CAPEX

#### The Decision Point(s)

**Decision 1: Financial Analysis**
Calculate the 5-year total cost of ownership, Year 1 cash flow impact, and impact on EBITDA for both approaches. Show your work.

**Decision 2: Strategic Recommendation**
Which approach do you recommend and why? Consider:
- Cash flow impact
- Strategic flexibility  
- Risk factors
- Market conditions (hardware industry is volatile)

**Decision 3: CFO Negotiation**
Present your case to Lisa (AI CFO). She will challenge your assumptions and test your financial reasoning.',
  
  '{
    "option_a_capex": {
      "upfront_cost": 1200000,
      "annual_maintenance": 80000,
      "depreciation_years": 5,
      "annual_depreciation": 240000,
      "efficiency_gain": 0.22,
      "expected_annual_savings": 350000
    },
    "option_b_opex": {
      "upfront_cost": 100000,
      "monthly_subscription": 25000,
      "annual_cost": 300000,
      "efficiency_gain": 0.18,
      "expected_annual_savings": 280000,
      "contract_term_months": 12
    },
    "current_state": {
      "annual_manufacturing_cost": 1500000,
      "current_ebitda": 800000,
      "cash_on_hand": 2000000,
      "monthly_burn_rate": 50000
    }
  }',
  
  '{
    "criteria": [
      {
        "competencyName": "Financial Acumen",
        "description": "Evaluates ability to correctly analyze CAPEX vs OPEX trade-offs",
        "scoringGuide": {
          "1": "Made significant errors in financial calculations or confused CAPEX/OPEX treatment",
          "2": "Basic calculations correct but missed important financial implications (cash flow timing, depreciation tax shield)",
          "3": "Correct analysis of both options including TCO, Year 1 P&L impact, and cash flow",
          "4": "Strong financial analysis including NPV calculation, payback period, and impact on key financial ratios",
          "5": "Exceptional analysis: calculated marginal ROI, considered opportunity cost of capital, and analyzed break-even scenarios if efficiency gains fall short of projections"
        }
      },
      {
        "competencyName": "Strategic Thinking",
        "description": "Evaluates ability to weigh non-financial strategic factors",
        "scoringGuide": {
          "1": "Made decision purely on one dimension (e.g., only 5-year TCO) without considering strategic context",
          "2": "Acknowledged some non-financial factors but didn''t integrate them into recommendation",
          "3": "Balanced financial and strategic factors, noting that OPEX approach provides more flexibility in volatile hardware market",
          "4": "Strong strategic reasoning: recognized that in a competitive/volatile market, preserving cash and maintaining flexibility is worth the higher 5-year cost",
          "5": "Exceptional strategic thinking: recommended a hybrid approach (OPEX to start, with option to purchase if market stabilizes), or recommended OPEX while using saved capital to invest in product innovation"
        }
      },
      {
        "competencyName": "Risk Management",
        "description": "Evaluates identification and mitigation of financial and operational risks",
        "scoringGuide": {
          "1": "Failed to identify major risks (e.g., technology obsolescence, vendor lock-in, cash flow constraints)",
          "2": "Identified some risks but didn''t propose mitigation strategies",
          "3": "Identified key risks with at least one mitigation strategy for each approach",
          "4": "Comprehensive risk analysis with specific mitigation plans and contingencies",
          "5": "Exceptional risk management: proposed a pilot program (partial automation) to test ROI assumptions before full commitment, or negotiated contract terms to reduce vendor lock-in risk in OPEX approach"
        }
      }
    ]
  }',
  'published');

-- Link cases to competencies
INSERT INTO public.case_competencies (case_id, competency_id) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111'), -- Growth Challenge -> Financial Acumen
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222'), -- Growth Challenge -> Strategic Thinking
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444'), -- Growth Challenge -> Risk Management
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222'), -- Innovation Challenge -> Strategic Thinking
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '44444444-4444-4444-4444-444444444444'), -- Innovation Challenge -> Risk Management
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '55555555-5555-5555-5555-555555555555'), -- Innovation Challenge -> Leadership Judgment
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '11111111-1111-1111-1111-111111111111'), -- Efficiency Challenge -> Financial Acumen
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '22222222-2222-2222-2222-222222222222'), -- Efficiency Challenge -> Strategic Thinking
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '44444444-4444-4444-4444-444444444444'); -- Efficiency Challenge -> Risk Management

-- Insert default forum channels
INSERT INTO public.forum_channels (id, name, description, slug) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Simulation Debriefs', 'Discuss your simulation results and learn from other members', 'simulation-debriefs'),
  ('ffffffff-ffff-ffff-ffff-ffffffffff22', 'Business News & Analysis', 'Share and discuss current business news and trends', 'business-news'),
  ('ffffffff-ffff-ffff-ffff-ffffffffff33', 'Career Paths', 'Advice and discussion about career development', 'career-paths'),
  ('ffffffff-ffff-ffff-ffff-ffffffffff44', 'General Discussion', 'Everything else', 'general');

-- Year 1 Detailed Competencies
INSERT INTO public.competencies (id, name, description, parent_id, level) VALUES
  -- Domain 1.1: Foundational Financial Acumen
  ('11111111-1111-1111-1111-111111111121', 'Foundational Financial Acumen', 'Understanding financial statements and core business metrics', '11111111-1111-1111-1111-111111111111', 'competency'),
  ('11111111-1111-1111-1111-111111111122', 'Financial Statement Analysis', 'Reading and interpreting P&L, Balance Sheet, Cash Flow', '11111111-1111-1111-1111-111111111121', 'micro_skill'),
  ('11111111-1111-1111-1111-111111111123', 'Core Financial Metrics', 'Gross Margin, Net Margin, EBITDA', '11111111-1111-1111-1111-111111111121', 'micro_skill'),
  
  -- Domain 1.2: Product & Go-to-Market Strategy
  ('22222222-2222-2222-2222-222222222231', 'Product & Go-to-Market Strategy', 'Marketing fundamentals and competitive positioning', '22222222-2222-2222-2222-222222222222', 'competency'),
  ('22222222-2222-2222-2222-222222222232', '4 Ps of Marketing', 'Product, Price, Place, Promotion framework', '22222222-2222-2222-2222-222222222231', 'micro_skill'),
  ('22222222-2222-2222-2222-222222222233', 'SWOT Analysis', 'Strategic situation assessment', '22222222-2222-2222-2222-222222222231', 'micro_skill'),
  ('22222222-2222-2222-2222-222222222234', 'Competitive Positioning', 'Differentiation and market positioning', '22222222-2222-2222-2222-222222222231', 'micro_skill'),
  ('22222222-2222-2222-2222-222222222235', 'B2C vs B2B GTM', 'Go-to-market model differences', '22222222-2222-2222-2222-222222222231', 'micro_skill'),
  
  -- Domain 1.3: Operational Management  
  ('22222222-2222-2222-2222-222222222241', 'Operational Management', 'Supply chain, processes, and operational efficiency', '22222222-2222-2222-2222-222222222222', 'competency'),
  ('22222222-2222-2222-2222-222222222242', 'Supply Chain Management', 'Inventory and logistics fundamentals', '22222222-2222-2222-2222-222222222241', 'micro_skill'),
  ('22222222-2222-2222-2222-222222222243', 'Lean & Agile Methodologies', 'Operational efficiency frameworks', '22222222-2222-2222-2222-222222222241', 'micro_skill'),
  ('22222222-2222-2222-2222-222222222244', 'Scaling Operations', 'Automation vs headcount decisions', '22222222-2222-2222-2222-222222222241', 'micro_skill'),
  ('22222222-2222-2222-2222-222222222245', 'KPIs and Dashboards', 'Performance measurement systems', '22222222-2222-2222-2222-222222222241', 'micro_skill'),
  
  -- Domain 1.4: People & Organizational Acumen
  ('55555555-5555-5555-5555-555555555551', 'People & Organizational Acumen', 'Team management and organizational design', '55555555-5555-5555-5555-555555555555', 'competency'),
  ('55555555-5555-5555-5555-555555555552', 'OKRs Framework', 'Objectives and Key Results methodology', '55555555-5555-5555-5555-555555555551', 'micro_skill'),
  ('55555555-5555-5555-5555-555555555553', 'Team Structure Design', 'Organizational architecture principles', '55555555-5555-5555-5555-555555555551', 'micro_skill'),
  ('55555555-5555-5555-5555-555555555554', 'Performance Management', 'Feedback and evaluation systems', '55555555-5555-5555-5555-555555555551', 'micro_skill'),
  ('55555555-5555-5555-5555-555555555556', 'Budget & Headcount Planning', 'Resource allocation and planning', '55555555-5555-5555-5555-555555555551', 'micro_skill');


