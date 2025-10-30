-- Year 1: The Operator's Residency - Complete Content
-- Domain 1.1: Foundational Financial Acumen (4 articles + 1 case)

-- Article 1: Reading the Three Financial Statements
INSERT INTO public.articles (id, competency_id, title, content, status) VALUES
('y1-art-001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111114', 'Reading the Three Financial Statements: P&L, Balance Sheet, and Cash Flow',
'### Core Principle

The three financial statements—the Income Statement (P&L), Balance Sheet, and Cash Flow Statement—are the fundamental tools for understanding a company''s financial health. Together, they tell a complete story: the P&L shows profitability, the Balance Sheet shows financial position, and the Cash Flow Statement shows liquidity.

**The Income Statement (P&L)** answers: "Did we make money this period?"
- Shows Revenue, Costs, and Net Income over a specific period (month, quarter, year)
- Organized as: Revenue - Cost of Goods Sold (COGS) = Gross Profit - Operating Expenses = Operating Income - Interest & Taxes = Net Income

**The Balance Sheet** answers: "What do we own and owe at this moment?"
- A snapshot in time (not a period)
- Organized as: Assets = Liabilities + Shareholders'' Equity
- Shows what the company owns (assets), what it owes (liabilities), and the residual value (equity)

**The Cash Flow Statement** answers: "Where did our cash come from and go?"
- Reconciles the P&L (accrual accounting) with actual cash movements
- Organized into three sections: Operating Activities, Investing Activities, Financing Activities
- Critical because profitable companies can still run out of cash

### The Framework / Model

**Income Statement Structure:**
```
Revenue (Top Line)
- Cost of Goods Sold (COGS)
= Gross Profit
- Operating Expenses (R&D, Sales & Marketing, G&A)
= Operating Income (EBIT)
- Interest Expense
- Taxes
= Net Income (Bottom Line)
```

**Balance Sheet Structure:**
```
ASSETS                          LIABILITIES
Current Assets                  Current Liabilities
  Cash                            Accounts Payable
  Accounts Receivable             Short-term Debt
  Inventory                     Long-term Liabilities
Fixed Assets                      Long-term Debt
  Property, Plant, Equipment    
  Intangible Assets             SHAREHOLDERS'' EQUITY
                                  Common Stock
Total Assets = Total Liabilities + Equity
```

**Cash Flow Statement Structure:**
```
Cash from Operating Activities
  Net Income
  + Depreciation & Amortization (non-cash expenses)
  +/- Changes in Working Capital
= Operating Cash Flow

Cash from Investing Activities
  - Capital Expenditures (CapEx)
  - Acquisitions
= Investing Cash Flow

Cash from Financing Activities
  + Debt Issued
  - Debt Repaid
  - Dividends Paid
= Financing Cash Flow

Net Change in Cash = Sum of all three sections
```

**How They Connect:**
- Net Income from P&L flows into Cash Flow Statement
- Net Income also increases Retained Earnings on the Balance Sheet
- Cash from Cash Flow Statement equals Cash on the Balance Sheet
- Depreciation on P&L relates to Fixed Assets on Balance Sheet

### Common Pitfalls

- **Confusing Profitability with Cash Flow:** A company can be profitable on the P&L but have negative cash flow if customers haven''t paid yet (high Accounts Receivable) or if it''s investing heavily in inventory or CapEx.

- **Ignoring Working Capital:** Changes in Accounts Receivable, Inventory, and Accounts Payable dramatically impact cash flow but don''t show up clearly on the P&L.

- **Missing the Accrual vs. Cash Distinction:** The P&L uses accrual accounting (revenue when earned, not when cash received). The Cash Flow Statement adjusts for this.

- **Overlooking One-Time Items:** Extraordinary items (asset sales, restructuring charges) can distort the true operational performance on the P&L.

### Application Example

**Case: Analyzing TechStart Inc.**

**Income Statement (Year 1):**
- Revenue: $5,000,000
- COGS: $1,500,000
- Gross Profit: $3,500,000 (70% margin)
- Operating Expenses: $4,000,000
- Operating Income: -$500,000
- Net Income: -$500,000 (Net Loss)

**Balance Sheet (End of Year 1):**
- Cash: $2,000,000
- Accounts Receivable: $1,000,000
- Total Assets: $5,000,000
- Total Liabilities: $500,000
- Shareholders'' Equity: $4,500,000

**Cash Flow Statement (Year 1):**
- Operating Cash Flow: -$300,000
- Investing Cash Flow: -$200,000 (bought equipment)
- Financing Cash Flow: +$3,000,000 (raised venture capital)
- Net Change in Cash: +$2,500,000

**Analysis:**
- The company is **unprofitable** (P&L shows -$500k loss)
- But it has **strong liquidity** ($2M cash on hand)
- It''s **burning cash operationally** (-$300k from operations)
- It **recently raised capital** (+$3M financing)
- The high Accounts Receivable ($1M) suggests customers are slow to pay

**Conclusion:** TechStart is a typical early-stage startup—losing money as it scales, but well-capitalized with 6-7 months of cash runway. The key metrics to watch: burn rate (operating cash flow) and accounts receivable collection.',
'published');

-- Article 2: Core Financial Metrics
INSERT INTO public.articles (id, competency_id, title, content, status) VALUES
('y1-art-002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111114', 'Core Financial Metrics: Gross Margin, Net Margin, and EBITDA',
'### Core Principle

Financial metrics distill complex financial statements into key performance indicators (KPIs) that enable rapid assessment of business health. The three most fundamental profitability metrics are Gross Margin, Net Margin, and EBITDA—each revealing different aspects of operational efficiency and profitability.

**Gross Margin** measures product economics—how much profit you make on each sale before accounting for operating expenses. It reveals pricing power and production efficiency.

**Net Margin** is the ultimate profitability test—after all expenses, what percentage of revenue becomes actual profit? This is the "bottom line" that determines shareholder value.

**EBITDA** (Earnings Before Interest, Taxes, Depreciation, and Amortization) is a proxy for operating cash flow and is widely used to compare companies with different capital structures and tax situations.

### The Framework / Model

**Gross Margin:**
```
Gross Profit = Revenue - Cost of Goods Sold (COGS)
Gross Margin % = (Gross Profit / Revenue) × 100%
```

**Example:** A SaaS company with $10M revenue and $2M in server/hosting costs:
```
Gross Margin = ($10M - $2M) / $10M = 80%
```

**Net Margin:**
```
Net Income = Revenue - All Expenses (COGS + OpEx + Interest + Taxes)
Net Margin % = (Net Income / Revenue) × 100%
```

**Example:** Same SaaS company with $10M revenue, $2M COGS, $7M operating expenses, $500k net income:
```
Net Margin = $500k / $10M = 5%
```

**EBITDA:**
```
EBITDA = Operating Income + Depreciation + Amortization
Or: EBITDA = Revenue - COGS - Operating Expenses (excluding D&A)
EBITDA Margin % = (EBITDA / Revenue) × 100%
```

**Why EBITDA Matters:**
- Removes the effects of financing decisions (interest)
- Removes the effects of tax environments
- Removes non-cash charges (depreciation, amortization)
- Result: A cleaner view of operational performance

**Benchmark Margins by Industry:**
- **Software/SaaS:** Gross Margin 70-90%, Net Margin 10-25%, EBITDA Margin 20-40%
- **E-commerce:** Gross Margin 30-50%, Net Margin 2-10%, EBITDA Margin 5-15%
- **Manufacturing:** Gross Margin 20-40%, Net Margin 5-15%, EBITDA Margin 10-20%
- **Consulting/Services:** Gross Margin 40-60%, Net Margin 10-20%, EBITDA Margin 15-25%

### Common Pitfalls

- **Confusing Gross and Net Margins:** A high gross margin doesn''t guarantee profitability if operating expenses are too high. Amazon famously had ~40% gross margins but near-zero net margins for years as it reinvested everything.

- **EBITDA Manipulation:** Companies can inflate EBITDA by capitalizing expenses that should be expensed. Be skeptical of "adjusted EBITDA" with many add-backs.

- **Ignoring Industry Context:** A 10% net margin is excellent for e-commerce but terrible for software. Always compare to industry benchmarks.

- **Missing the Gross Margin Trend:** Declining gross margins often signal increasing competition, pricing pressure, or rising input costs—a serious red flag.

### Application Example

**Case: Comparing Two SaaS Companies**

**Company A (High Gross, Low Net):**
- Revenue: $50M
- COGS: $5M (primarily cloud infrastructure)
- Gross Margin: 90%
- Operating Expenses: $40M (heavy sales and R&D investment)
- Net Income: $5M
- Net Margin: 10%
- EBITDA: $15M (assumes $10M in D&A)
- EBITDA Margin: 30%

**Company B (Lower Gross, Higher Net):**
- Revenue: $50M
- COGS: $15M (more services, professional services team)
- Gross Margin: 70%
- Operating Expenses: $25M (leaner operations)
- Net Income: $10M
- Net Margin: 20%
- EBITDA: $15M
- EBITDA Margin: 30%

**Analysis:**
Company A has superior gross margins (90% vs. 70%), indicating a more scalable product model. However, Company B has higher net margins (20% vs. 10%) due to operational discipline.

Both have identical EBITDA ($15M), but Company A is investing more aggressively for growth (higher OpEx). 

**Investment Decision:** Company A is likely earlier-stage, burning cash to grow. Company B is more mature and profitable. Your investment choice depends on your appetite for growth vs. profitability.',
'published');

-- Continue with Year 1 content...
-- Due to length constraints, I''ll create this in batches


