-- YEAR 1: THE OPERATOR'S RESIDENCY - ALL ARTICLES
-- Complete production-ready content following Document 3 templates

-- First, insert the Year 1 competency structure
INSERT INTO public.competencies (id, name, description, parent_id, level) VALUES
  -- Domain 1.1: Foundational Financial Acumen
  ('y1-d1-1000-0000-0000-0000-000000000001', 'Foundational Financial Acumen', 'Understanding financial statements and core business metrics', '11111111-1111-1111-1111-111111111111', 'competency'),
  ('y1-d1-1100-0000-0000-0000-000000000001', 'Financial Statement Analysis', 'Reading and interpreting P&L, Balance Sheet, Cash Flow', 'y1-d1-1000-0000-0000-0000-000000000001', 'micro_skill'),
  ('y1-d1-1200-0000-0000-0000-000000000001', 'Core Financial Metrics', 'Gross Margin, Net Margin, EBITDA', 'y1-d1-1000-0000-0000-0000-000000000001', 'micro_skill'),
  
  -- Domain 1.2: Product & Go-to-Market Strategy
  ('y1-d1-2000-0000-0000-0000-000000000002', 'Product & Go-to-Market Strategy', 'Marketing fundamentals and competitive positioning', '22222222-2222-2222-2222-222222222222', 'competency'),
  ('y1-d1-2100-0000-0000-0000-000000000001', '4 Ps of Marketing', 'Product, Price, Place, Promotion framework', 'y1-d1-2000-0000-0000-0000-000000000002', 'micro_skill'),
  ('y1-d1-2200-0000-0000-0000-000000000001', 'SWOT Analysis', 'Strategic situation assessment', 'y1-d1-2000-0000-0000-0000-000000000002', 'micro_skill'),
  ('y1-d1-2300-0000-0000-0000-000000000001', 'Competitive Positioning', 'Differentiation and market positioning', 'y1-d1-2000-0000-0000-0000-000000000002', 'micro_skill'),
  ('y1-d1-2400-0000-0000-0000-000000000001', 'B2C vs B2B GTM', 'Go-to-market model differences', 'y1-d1-2000-0000-0000-0000-000000000002', 'micro_skill'),
  
  -- Domain 1.3: Operational Management  
  ('y1-d1-3000-0000-0000-0000-000000000003', 'Operational Management', 'Supply chain, processes, and operational efficiency', '22222222-2222-2222-2222-222222222222', 'competency'),
  ('y1-d1-3100-0000-0000-0000-000000000001', 'Supply Chain Management', 'Inventory and logistics fundamentals', 'y1-d1-3000-0000-0000-0000-000000000003', 'micro_skill'),
  ('y1-d1-3200-0000-0000-0000-000000000001', 'Lean & Agile Methodologies', 'Operational efficiency frameworks', 'y1-d1-3000-0000-0000-0000-000000000003', 'micro_skill'),
  ('y1-d1-3300-0000-0000-0000-000000000001', 'Scaling Operations', 'Automation vs headcount decisions', 'y1-d1-3000-0000-0000-0000-000000000003', 'micro_skill'),
  ('y1-d1-3400-0000-0000-0000-000000000001', 'KPIs and Dashboards', 'Performance measurement systems', 'y1-d1-3000-0000-0000-0000-000000000003', 'micro_skill'),
  
  -- Domain 1.4: People & Organizational Acumen
  ('y1-d1-4000-0000-0000-0000-000000000004', 'People & Organizational Acumen', 'Team management and organizational design', '55555555-5555-5555-5555-555555555555', 'competency'),
  ('y1-d1-4100-0000-0000-0000-000000000001', 'OKRs Framework', 'Objectives and Key Results methodology', 'y1-d1-4000-0000-0000-0000-000000000004', 'micro_skill'),
  ('y1-d1-4200-0000-0000-0000-000000000001', 'Team Structure Design', 'Organizational architecture principles', 'y1-d1-4000-0000-0000-0000-000000000004', 'micro_skill'),
  ('y1-d1-4300-0000-0000-0000-000000000001', 'Performance Management', 'Feedback and evaluation systems', 'y1-d1-4000-0000-0000-0000-000000000004', 'micro_skill'),
  ('y1-d1-4400-0000-0000-0000-000000000001', 'Budget & Headcount Planning', 'Resource allocation and planning', 'y1-d1-4000-0000-0000-0000-000000000004', 'micro_skill');

-- Now insert all Year 1 articles with production-quality content

-- DOMAIN 1.1: FOUNDATIONAL FINANCIAL ACUMEN

-- Article 1: Reading Financial Statements
INSERT INTO public.articles (id, competency_id, title, content, status) VALUES
('y1-a01-0000-0000-0000-0000-000000000001', 'y1-d1-1100-0000-0000-0000-000000000001', 'Reading the Three Financial Statements', 
'### Core Principle

The three financial statements—the Income Statement (P&L), Balance Sheet, and Cash Flow Statement—are the language of business. Together, they provide a complete picture of a company''s financial health. Understanding how to read and interpret these statements is the foundation of business acumen.

**The Income Statement (P&L)** answers: "*Did we make money this period?*"
- Shows Revenue, Costs, and Net Income over a specific time period
- Organized from top (Revenue) to bottom (Net Income)
- Uses accrual accounting (revenue recognized when earned, not when cash received)

**The Balance Sheet** answers: "*What do we own and owe right now?*"
- A snapshot at a specific moment in time
- Shows Assets (what we own), Liabilities (what we owe), and Equity (residual value)
- Must always balance: Assets = Liabilities + Equity

**The Cash Flow Statement** answers: "*Where did our cash actually go?*"
- Reconciles accrual-based P&L with actual cash movements
- Critical because profitable companies can still run out of cash
- Shows cash from Operations, Investing, and Financing activities

### The Framework / Model

**Income Statement (P&L) Structure:**
```
Revenue (Sales, Top Line)
  - Cost of Goods Sold (COGS)
  = Gross Profit
  
  - Operating Expenses
    • Research & Development (R&D)
    • Sales & Marketing (S&M)
    • General & Administrative (G&A)
  = Operating Income (EBIT)
  
  - Interest Expense
  - Taxes
  = Net Income (Bottom Line, Earnings)
```

**Key P&L Metrics:**
- **Gross Profit Margin** = Gross Profit / Revenue
- **Operating Margin** = Operating Income / Revenue  
- **Net Profit Margin** = Net Income / Revenue

**Balance Sheet Structure:**
```
ASSETS                          LIABILITIES & EQUITY
---------------------           ---------------------
Current Assets                  Current Liabilities
• Cash & Equivalents             • Accounts Payable
• Accounts Receivable            • Accrued Expenses
• Inventory                      • Short-term Debt
• Prepaid Expenses             
                                Long-term Liabilities
Fixed (Non-Current) Assets       • Long-term Debt
• Property, Plant & Equipment    • Deferred Revenue
• Intangible Assets            
• Goodwill                      Shareholders'' Equity
                                 • Common Stock
                                 • Retained Earnings
                                 • Additional Paid-in Capital

Total Assets                  = Total Liabilities + Equity
```

**Cash Flow Statement Structure:**
```
OPERATING ACTIVITIES
  Net Income
  + Depreciation & Amortization (add back non-cash expenses)
  - Increase in Accounts Receivable (cash not yet collected)
  + Increase in Accounts Payable (haven''t paid yet)
  +/- Other working capital changes
  = Cash from Operating Activities

INVESTING ACTIVITIES  
  - Capital Expenditures (CapEx)
  - Acquisitions
  + Asset Sales
  = Cash from Investing Activities

FINANCING ACTIVITIES
  + Debt Issued
  - Debt Repaid
  + Stock Issued
  - Dividends Paid
  - Stock Buybacks
  = Cash from Financing Activities

NET CHANGE IN CASH = Sum of all three sections
Beginning Cash + Net Change = Ending Cash (matches Balance Sheet)
```

**How the Three Statements Connect:**

1. **P&L → Cash Flow:** Net Income is the starting point for operating cash flow
2. **P&L → Balance Sheet:** Net Income increases Retained Earnings in equity
3. **Cash Flow → Balance Sheet:** Ending cash equals cash on Balance Sheet
4. **P&L ↔ Balance Sheet:** Depreciation on P&L reduces Fixed Assets value

### Common Pitfalls

**Confusing Profit and Cash:** A company can be profitable (positive Net Income) but have negative cash flow if:
- Customers haven''t paid yet (high Accounts Receivable)
- Heavy inventory buildup
- Large capital investments (CapEx)

**Example:** A growing SaaS company with $1M in Net Income might have negative operating cash flow due to unpaid receivables and upfront customer acquisition costs.

**Ignoring Working Capital:** Small changes in Accounts Receivable, Inventory, and Accounts Payable can have massive cash flow impacts.

**Example:** If you grow revenue 50% and Accounts Receivable also grows 50%, you''re funding your customers'' credit with your cash.

**Missing One-Time Items:** Extraordinary items (asset sales, restructuring costs) can distort operational performance.

**Focusing Only on Net Income:** Companies can manipulate Net Income through accounting choices, but cash flow is harder to fake.

**Not Reading the Footnotes:** Critical details about accounting policies, contingent liabilities, and off-balance-sheet items hide in footnotes.

### Application Example

**Case Study: Analyzing RetailCo''s Financial Health**

**Income Statement (FY 2024):**
- Revenue: $100M
- COGS: $60M  
- Gross Profit: $40M (40% margin)
- Operating Expenses: $30M
- Operating Income: $10M
- Net Income: $7M (7% net margin)

**Balance Sheet (End of FY 2024):**
- Assets: Cash $5M, AR $15M, Inventory $20M, Fixed Assets $30M = $70M total
- Liabilities: AP $10M, Debt $20M = $30M total
- Equity: $40M
- Check: $70M = $30M + $40M ✓

**Cash Flow Statement (FY 2024):**
- Operating CF: $3M (Net Income $7M + Depreciation $5M - Working Capital increase $9M)
- Investing CF: -$10M (bought new stores)
- Financing CF: +$5M (issued debt)
- Net Change in Cash: -$2M (started with $7M, ended with $5M)

**Analysis:**

**Strengths:**
- Profitable: $7M net income, healthy 7% margin for retail
- Solid Balance Sheet: $40M equity vs $20M debt (2:1 equity/debt ratio)

**Red Flags:**
- Negative operating cash flow despite being profitable
- AR grew to $15M (15% of revenue)—customers taking 55 days to pay
- Inventory at $20M is 33% of COGS—potential overstocking
- Needed to borrow $5M to fund growth

**Conclusion:** RetailCo is profitable but has a working capital problem. Growth is consuming cash faster than operations generate it. Management must focus on:
1. Collections (reduce AR days)
2. Inventory management (reduce excess stock)
3. Otherwise, despite profitability, they''ll face a cash crisis

**Key Lesson:** The Income Statement says "we''re profitable," but the Cash Flow Statement says "we''re running out of money." Both are true—and the Cash Flow Statement is more urgent.',
'published');

-- Article 2: Core Financial Metrics  
INSERT INTO public.articles (id, competency_id, title, content, status) VALUES
('y1-a02-0000-0000-0000-0000-000000000002', 'y1-d1-1200-0000-0000-0000-000000000001', 'Core Financial Metrics: Gross Margin, Net Margin, and EBITDA',
'### Core Principle

Financial metrics transform raw financial data into actionable insights. The three most critical profitability metrics are Gross Margin, Net Margin, and EBITDA. Each reveals different aspects of business health and operates at different levels of the income statement.

**Gross Margin** measures product/service economics before considering operating costs. It reveals pricing power, production efficiency, and fundamental unit economics. A strong gross margin is the foundation for profitability.

**Net Margin** is the ultimate bottom-line test—after ALL expenses (operating, interest, taxes), what percentage of revenue becomes profit? This determines shareholder value creation.

**EBITDA** (Earnings Before Interest, Taxes, Depreciation, Amortization) approximates operating cash flow and enables comparison across companies with different capital structures, tax situations, and depreciation policies.

### The Framework / Model

**Gross Margin:**
```
Gross Profit = Revenue - Cost of Goods Sold (COGS)
Gross Margin % = (Gross Profit / Revenue) × 100%
```

**What''s in COGS (varies by industry):**
- Manufacturing: Raw materials, direct labor, factory overhead
- SaaS: Hosting costs, customer support, implementation services
- Retail: Wholesale cost of inventory
- Consulting: Billable employee costs

**Net Margin:**
```
Net Income = Revenue - All Expenses
Net Margin % = (Net Income / Revenue) × 100%
```

**EBITDA:**
```
EBITDA = Revenue - COGS - Operating Expenses (excluding D&A)
OR: EBITDA = Operating Income + Depreciation + Amortization
EBITDA Margin % = (EBITDA / Revenue) × 100%
```

**Why EBITDA Exists:**
- **Interest:** Removed because financing is a choice, not operational performance
- **Taxes:** Removed because tax rates vary by jurisdiction
- **Depreciation & Amortization:** Removed because they''re non-cash accounting entries

**Result:** EBITDA shows pure operational performance independent of capital structure and accounting policies.

**Industry Benchmarks:**

| Industry | Gross Margin | EBITDA Margin | Net Margin |
|----------|--------------|---------------|------------|
| Enterprise SaaS | 75-85% | 25-40% | 10-20% |
| Consumer SaaS | 65-75% | 15-30% | 5-15% |
| E-commerce | 25-40% | 5-12% | 2-8% |
| Manufacturing | 25-40% | 12-20% | 5-12% |
| Professional Services | 45-60% | 15-25% | 8-15% |
| Restaurants | 60-70% | 12-18% | 3-8% |

### Common Pitfalls

**Margin Confusion:** High gross margin doesn''t guarantee profitability. Amazon had ~40% gross margins but operated at near-zero net margins for years, reinvesting everything into growth.

**EBITDA Manipulation:** Be skeptical of "Adjusted EBITDA" with many add-backs. Companies sometimes exclude legitimate expenses to inflate this number.

**Example of EBITDA Abuse:**
```
Reported EBITDA: $50M
Less: Stock-based compensation (excluded but is a real cost): $15M
Less: "One-time" restructuring (happens every year): $10M
True Economic EBITDA: $25M
```

**Ignoring Industry Context:** Comparing metrics across industries is misleading. A 10% net margin is excellent for grocery retail but terrible for software.

**Missing the Trend:** Static metrics are less important than trends. Declining gross margins signal pricing pressure or rising costs—a serious red flag.

**Forgetting Scale Economics:** Margins often improve with scale as fixed costs spread over larger revenue. Early-stage companies may have terrible margins that will improve.

### Application Example

**Case: Comparing Three $100M Revenue Companies**

**Company A: High-Growth SaaS**
- Revenue: $100M
- COGS: $20M (20% cloud infrastructure, support)
- Gross Margin: 80%
- Operating Expenses: $65M (heavy R&D and sales)
- EBITDA: $15M (15% margin)
- D&A: $5M
- Operating Income: $10M
- Net Income: $5M (5% margin)

**Company B: Mature SaaS**
- Revenue: $100M
- COGS: $25M (25% - more services)
- Gross Margin: 75%
- Operating Expenses: $45M (efficient operations)
- EBITDA: $30M (30% margin)
- D&A: $5M
- Operating Income: $25M
- Net Income: $20M (20% margin)

**Company C: E-commerce**
- Revenue: $100M
- COGS: $70M (70% - product costs)
- Gross Margin: 30%
- Operating Expenses: $25M
- EBITDA: $5M (5% margin)
- D&A: $2M
- Operating Income: $3M
- Net Income: $2M (2% margin)

**Analysis:**

**Company A:** Growing aggressively, burning cash on customer acquisition. Gross margins excellent (80%), but net margins thin (5%) due to growth investment. Investors value growth over current profitability.

**Company B:** Mature, profitable, efficient. Best-in-class net margins (20%). Less exciting growth, but generates significant cash. Ideal for private equity or dividend-seeking investors.

**Company C:** Typical e-commerce economics. Thin margins (2% net) require massive scale to succeed. Must be laser-focused on operational efficiency.

**Investment Decision:** Depends on your strategy:
- Growth investor? → Company A (sacrifice current profit for market share)
- Value investor? → Company B (profit today, stable cash generation)
- Scale player? → Company C (bet on volume making up for thin margins)

**Key Insight:** All three have the same $100M revenue, but completely different economic profiles. Metrics reveal the truth.',
'published');

-- Continue with remaining Year 1 articles in next file chunk...


