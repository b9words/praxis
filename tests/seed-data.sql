-- Comprehensive Test Seed Data for E2E Testing
-- This file populates the database with complete test data for all user flows

-- Clear existing data (in reverse dependency order)
DELETE FROM notifications;
DELETE FROM user_applications;
DELETE FROM subscriptions;
DELETE FROM user_residency;
DELETE FROM user_lesson_progress;
DELETE FROM user_article_progress;
DELETE FROM debriefs;
DELETE FROM simulations;
DELETE FROM forum_posts;
DELETE FROM forum_threads;
DELETE FROM forum_channels;
DELETE FROM case_competencies;
DELETE FROM cases;
DELETE FROM articles;
DELETE FROM competencies;
DELETE FROM profiles;

-- Reset sequences
ALTER SEQUENCE competencies_id_seq RESTART WITH 1;
ALTER SEQUENCE articles_id_seq RESTART WITH 1;
ALTER SEQUENCE cases_id_seq RESTART WITH 1;

-- Insert test users
INSERT INTO profiles (id, username, full_name, avatar_url, bio, is_public, role, email_notifications_enabled, created_at, updated_at) VALUES
  -- Test member user
  ('test-user-1', 'testmember', 'Test Member', 'https://api.dicebear.com/7.x/avataaars/svg?seed=testmember', 'Test user for E2E testing', true, 'member', true, NOW(), NOW()),
  
  -- Test admin user
  ('test-user-2', 'testadmin', 'Test Admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=testadmin', 'Test admin for E2E testing', true, 'admin', true, NOW(), NOW()),
  
  -- Test editor user
  ('test-user-3', 'testeditor', 'Test Editor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=testeditor', 'Test editor for E2E testing', true, 'editor', true, NOW(), NOW());

-- Insert competencies (from existing seed.sql)
INSERT INTO competencies (id, name, description, parent_id, level, residency_year, display_order, created_at, updated_at) VALUES
  -- Core domains (level 1)
  ('11111111-1111-1111-1111-111111111111', 'Financial Acumen', 'Understanding and applying financial principles to business decisions', NULL, 'domain', 1, 1, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Strategic Thinking', 'Ability to formulate and execute long-term business strategy', NULL, 'domain', 1, 2, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Market Awareness', 'Understanding market dynamics, competition, and customer needs', NULL, 'domain', 1, 3, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'Risk Management', 'Identifying, assessing, and mitigating business risks', NULL, 'domain', 1, 4, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Leadership Judgment', 'Making sound decisions and leading teams effectively', NULL, 'domain', 1, 5, NOW(), NOW()),
  
  -- Financial Acumen sub-competencies
  ('11111111-1111-1111-1111-111111111112', 'Investment Analysis', 'Evaluating investment opportunities and returns', '11111111-1111-1111-1111-111111111111', 'competency', 1, 1, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111113', 'Cost Management', 'Managing operational and capital expenditures', '11111111-1111-1111-1111-111111111111', 'competency', 1, 2, NOW(), NOW()),
  
  -- Financial Acumen micro-skills
  ('11111111-1111-1111-1111-111111111114', 'ROI & CAC Calculation', 'Calculate and interpret ROI and Customer Acquisition Cost', '11111111-1111-1111-1111-111111111112', 'micro_skill', 1, 1, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111115', 'OPEX vs CAPEX', 'Distinguish between and manage operational and capital expenses', '11111111-1111-1111-1111-111111111113', 'micro_skill', 1, 2, NOW(), NOW()),
  
  -- Strategic Thinking sub-competencies
  ('22222222-2222-2222-2222-222222222223', 'Innovation Strategy', 'Developing strategies for innovation and disruption', '22222222-2222-2222-2222-222222222222', 'competency', 1, 1, NOW(), NOW()),
  
  -- Strategic Thinking micro-skills
  ('22222222-2222-2222-2222-222222222224', 'Innovator''s Dilemma', 'Understanding and navigating disruptive innovation', '22222222-2222-2222-2222-222222222223', 'micro_skill', 1, 1, NOW(), NOW());

-- Insert test articles
INSERT INTO articles (id, competency_id, title, content, description, status, created_by, updated_by, created_at, updated_at) VALUES
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
  'Master the fundamentals of ROI and CAC calculations for business decision-making', 'published', 'test-user-2', 'test-user-2', NOW(), NOW()),

  -- Article 2: The Innovator's Dilemma
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaabb', '22222222-2222-2222-2222-222222222224', 'Framework: The Innovator''s Dilemma', 
  '### Core Principle

The Innovator''s Dilemma, introduced by Clayton Christensen, explains why successful companies often fail when faced with disruptive innovation. The paradox is that the very management practices that make companies successful in the present—listening to customers, investing in the most profitable products, and focusing on core competencies—can lead to their downfall when disruptive technologies emerge.

Disruptive innovations typically start by serving a niche market with a "worse" product (on traditional metrics) that is cheaper, simpler, or more convenient. Incumbent companies rationally ignore these innovations because their best customers don''t want them. By the time the disruptive technology improves enough to serve the mainstream market, it''s too late for the incumbent to catch up.

### The Framework / Model

**The Disruption Process:**
1. **New Market Disruption:** A new technology enables a new market that didn''t exist before
2. **Low-End Disruption:** A simpler, cheaper solution targets the least profitable customers
3. **Performance Improvement:** The disruptive technology improves until it meets mainstream needs
4. **Market Capture:** The disruptor captures the mainstream market from incumbents

**Key Characteristics of Disruptive Innovations:**
- Initially perform worse on traditional metrics
- Are simpler and cheaper
- Appeal to new or low-end customers first
- Improve rapidly over time
- Eventually meet mainstream performance needs

### Common Pitfalls

- **Listening Too Closely to Best Customers:** Incumbents focus on what their most profitable customers want, missing disruptive signals
- **Over-Engineering Solutions:** Adding features that mainstream customers don''t need while ignoring simplicity
- **Ignoring "Inferior" Technologies:** Dismissing technologies that don''t meet current performance standards
- **Short-Term Financial Focus:** Prioritizing quarterly results over long-term strategic positioning

### Application Example

**Case: Digital Photography Disruption**

Kodak invented the digital camera in 1975 but failed to capitalize on it. Why?

**Traditional Analysis:** Kodak''s film business was highly profitable, and digital cameras initially had poor image quality compared to film.

**Disruptive Analysis:** Digital photography started as a "worse" solution (poor image quality, expensive) but offered convenience and instant results. It initially appealed to:
- Professional photographers (new market)
- Tech enthusiasts (low-end of professional market)
- Eventually improved to meet mainstream consumer needs

**Kodak''s Mistake:** They focused on improving film quality and ignored the digital market until it was too late. They had the technology but lacked the strategic framework to recognize its disruptive potential.

**The Lesson:** Sometimes the "worse" solution today becomes the dominant solution tomorrow. Companies must balance serving current customers with preparing for future disruptions.', 
  'Understand how disruptive innovation can topple even the most successful companies', 'published', 'test-user-2', 'test-user-2', NOW(), NOW()),

  -- Article 3: Unit Economics
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaacc', '11111111-1111-1111-1111-111111111115', 'Framework: Unit Economics Mastery', 
  '### Core Principle

Unit economics is the fundamental analysis of the revenue and costs associated with a single unit of your business. For SaaS companies, this typically means analyzing the economics of acquiring and serving one customer. For e-commerce, it might be analyzing the economics of one product sale.

Understanding unit economics is crucial because it tells you whether your business model is fundamentally sound. You can have the best product in the world, but if your unit economics are broken, you''ll eventually run out of money.

### The Framework / Model

**Key Unit Economics Metrics:**

1. **Customer Acquisition Cost (CAC):** Total cost to acquire one customer
2. **Lifetime Value (LTV):** Total revenue generated from one customer over their lifetime
3. **LTV:CAC Ratio:** Should be at least 3:1 for healthy unit economics
4. **Payback Period:** How long it takes to recover the cost of acquiring a customer
5. **Gross Margin:** Revenue minus direct costs per unit
6. **Contribution Margin:** Gross margin minus variable costs

**The Unit Economics Formula:**
```
Unit Profit = LTV - CAC - (Monthly Service Cost × Customer Lifetime)
```

### Common Pitfalls

- **Incomplete Cost Attribution:** Not including all costs (marketing, sales, onboarding) in CAC
- **Overestimating LTV:** Assuming customers will stay longer than they actually do
- **Ignoring Churn:** Not accounting for customer loss in LTV calculations
- **Mixing Time Periods:** Calculating CAC and LTV over different time periods
- **Not Segmenting:** Treating all customers the same when unit economics vary by segment

### Application Example

**Case: SaaS Startup Analysis**

A B2B SaaS company has:
- Average deal size: $1,200/month
- Average customer lifetime: 18 months
- Monthly churn rate: 5%
- Sales and marketing spend: $100,000/month
- New customers: 50/month
- Direct service costs: $200/customer/month

**Calculations:**
```
CAC = $100,000 / 50 = $2,000
LTV = $1,200 × 18 = $21,600
LTV:CAC = $21,600 / $2,000 = 10.8:1 ✓
Payback Period = $2,000 / $1,200 = 1.7 months ✓
Contribution Margin = $1,200 - $200 = $1,000/month ✓
```

**Analysis:** This company has excellent unit economics. The 10.8:1 LTV:CAC ratio is well above the 3:1 threshold, and the 1.7-month payback period is very healthy.

**Red Flags to Watch:**
- If churn increases to 10%, LTV drops to $12,000 and LTV:CAC becomes 6:1 (still good)
- If CAC increases to $4,000, LTV:CAC becomes 5.4:1 (acceptable but concerning)
- If both happen, LTV:CAC becomes 3:1 (danger zone)', 
  'Master unit economics to build a sustainable business model', 'published', 'test-user-2', 'test-user-2', NOW(), NOW());

-- Insert test cases
INSERT INTO cases (id, title, briefing_doc, description, datasets, rubric, status, difficulty, estimated_minutes, prerequisites, storage_path, metadata, created_by, updated_by, created_at, updated_at) VALUES
  ('test-case-1', 'The Unit Economics Crisis: SaaS Startup Burning Cash', 
  '# Case Brief: CloudSync Unit Economics Crisis

## Your Role
You are the Finance & Operations Manager at CloudSync, a B2B SaaS startup. With only 6 months of runway remaining and concerning unit economics, you must analyze the situation and present recommendations to save the company.

## The Situation
CloudSync has been growing rapidly in terms of customer count, but the unit economics are fundamentally broken. The board is getting nervous, and you have 2 weeks to present a comprehensive analysis and action plan.

## Key Data Points
- Monthly Recurring Revenue (MRR): $180,000
- Monthly Burn Rate: $550,000
- Cash Remaining: $3.2 million
- Runway: 5.8 months
- Customer Acquisition Cost (CAC): $4,800
- Lifetime Value (LTV): $7,200
- LTV:CAC Ratio: 1.5:1 (Critical - should be 3:1+)
- Monthly Churn Rate: 8% (High - should be 2-5%)

## The Challenge
The founding team is split on strategy:
- CEO wants to grow faster to hit Series B metrics
- CTO wants to optimize infrastructure costs first
- VP Sales wants more marketing spend for lead generation

## Your Mission
Analyze the root causes of the unit economics crisis and recommend immediate actions for the next 30-90 days. Your analysis will determine whether the company survives or faces a down-round.',
  'A comprehensive case study on fixing broken unit economics in a SaaS startup', 
  '{"financial_data": "CloudSync Financial Dashboard Q4 2023.csv", "cohort_analysis": "Customer Cohort Analysis - Last 12 Months.csv"}',
  '{"criteria": {"financial_analysis": {"weight": 0.3, "description": "Ability to analyze financial data and identify key metrics"}, "strategic_thinking": {"weight": 0.3, "description": "Strategic decision-making and prioritization"}, "communication": {"weight": 0.2, "description": "Clear communication of recommendations"}, "execution": {"weight": 0.2, "description": "Practical implementation of solutions"}}}',
  'published', 'intermediate', 120, '[]', 'case-studies/cs_unit_economics_crisis.json', '{"version": "1.0", "tags": ["unit-economics", "saas", "crisis-management"]}',
  'test-user-2', 'test-user-2', NOW(), NOW()),

  ('test-case-2', 'Market Positioning Dilemma: TechCorp vs Competitors',
  '# Case Brief: Market Positioning Crisis

## Your Role
You are the VP of Strategy at TechCorp, a mid-size technology company facing intense competition and market confusion about your value proposition.

## The Situation
TechCorp has been losing market share to both larger competitors (who can offer lower prices) and smaller startups (who can offer more specialized solutions). Your positioning is unclear, and customers are confused about what makes you different.

## Key Challenges
- Revenue growth has stalled at 5% annually
- Customer acquisition costs have increased 40% over the past year
- Win rate against competitors has dropped from 60% to 35%
- Customer feedback indicates confusion about your value proposition

## Your Mission
Develop a clear market positioning strategy that differentiates TechCorp from both larger and smaller competitors while maintaining profitability.',
  'A strategic case study on market positioning and competitive differentiation',
  '{"market_data": "Competitive Analysis Q4 2023.csv", "customer_feedback": "Customer Survey Results.csv"}',
  '{"criteria": {"market_analysis": {"weight": 0.25, "description": "Understanding of market dynamics and competition"}, "strategic_positioning": {"weight": 0.35, "description": "Development of clear value proposition"}, "competitive_strategy": {"weight": 0.25, "description": "Differentiation strategy"}, "implementation": {"weight": 0.15, "description": "Practical execution plan"}}',
  'published', 'beginner', 90, '[]', 'case-studies/cs_market_positioning_dilemma.json', '{"version": "1.0", "tags": ["strategy", "positioning", "competition"]}',
  'test-user-2', 'test-user-2', NOW(), NOW());

-- Link cases to competencies
INSERT INTO case_competencies (case_id, competency_id) VALUES
  ('test-case-1', '11111111-1111-1111-1111-111111111111'),
  ('test-case-1', '11111111-1111-1111-1111-111111111114'),
  ('test-case-1', '11111111-1111-1111-1111-111111111115'),
  ('test-case-2', '22222222-2222-2222-2222-222222222222'),
  ('test-case-2', '33333333-3333-3333-3333-333333333333');

-- Insert forum channels
INSERT INTO forum_channels (id, name, description, slug, created_at, updated_at) VALUES
  ('channel-1', 'General Discussion', 'General business and strategy discussions', 'general', NOW(), NOW()),
  ('channel-2', 'Case Studies', 'Discussion about completed case simulations', 'case-studies', NOW(), NOW()),
  ('channel-3', 'Learning Resources', 'Share and discuss learning materials', 'learning', NOW(), NOW()),
  ('channel-4', 'Career Advice', 'Career development and professional growth', 'career', NOW(), NOW());

-- Insert forum threads
INSERT INTO forum_threads (id, channel_id, author_id, title, content, is_pinned, metadata, created_at, updated_at) VALUES
  ('thread-1', 'channel-1', 'test-user-1', 'Welcome to the Praxis Community!', 
   'Welcome everyone! I''m excited to be part of this community of ambitious professionals. Looking forward to learning and growing together.', 
   true, '{"type": "welcome"}', NOW(), NOW()),
  
  ('thread-2', 'channel-2', 'test-user-1', 'Unit Economics Case - Key Insights', 
   'Just completed the Unit Economics Crisis case. The most important insight was understanding that LTV:CAC ratio is more important than raw growth numbers. What did others learn from this case?', 
   false, '{"case_id": "test-case-1", "type": "case_discussion"}', NOW(), NOW()),
  
  ('thread-3', 'channel-3', 'test-user-2', 'ROI vs IRR - When to Use Which?', 
   'Great question came up in the ROI article discussion. When should you use ROI vs IRR for investment decisions? Here''s my take...', 
   false, '{"article_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "type": "article_discussion"}', NOW(), NOW());

-- Insert forum posts (replies)
INSERT INTO forum_posts (id, thread_id, author_id, content, parent_post_id, created_at, updated_at) VALUES
  ('post-1', 'thread-1', 'test-user-2', 'Thanks for the warm welcome! I''m particularly interested in the simulation cases. How challenging are they?', NULL, NOW(), NOW()),
  ('post-2', 'thread-1', 'test-user-3', 'Welcome! The cases are definitely challenging but very rewarding. Start with the beginner ones and work your way up.', NULL, NOW(), NOW()),
  ('post-3', 'thread-2', 'test-user-2', 'I found the churn analysis particularly insightful. 8% monthly churn is devastating for LTV calculations.', NULL, NOW(), NOW()),
  ('post-4', 'thread-2', 'test-user-3', 'Agreed! The cohort analysis really shows how churn compounds over time. What strategies did you recommend for reducing it?', NULL, NOW(), NOW());

-- Insert user residency
INSERT INTO user_residency (id, user_id, current_residency, started_at, updated_at) VALUES
  ('residency-1', 'test-user-1', 1, NOW(), NOW()),
  ('residency-2', 'test-user-2', 1, NOW(), NOW()),
  ('residency-3', 'test-user-3', 1, NOW(), NOW());

-- Insert user progress (some completed articles)
INSERT INTO user_article_progress (id, user_id, article_id, status, completed_at, created_at, updated_at) VALUES
  ('progress-1', 'test-user-1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('progress-2', 'test-user-1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaabb', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('progress-3', 'test-user-2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Insert lesson progress
INSERT INTO user_lesson_progress (id, user_id, domain_id, module_id, lesson_id, status, progress_percentage, time_spent_seconds, last_read_position, completed_at, bookmarked, created_at, updated_at) VALUES
  ('lesson-progress-1', 'test-user-1', 'financial-acumen', 'unit-economics', 'roi-cac-basics', 'completed', 100, 1800, '{"scrollTop": 1000}', NOW() - INTERVAL '2 days', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('lesson-progress-2', 'test-user-1', 'strategic-thinking', 'innovation', 'disruptive-innovation', 'completed', 100, 2400, '{"scrollTop": 1200}', NOW() - INTERVAL '1 day', false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('lesson-progress-3', 'test-user-1', 'financial-acumen', 'unit-economics', 'ltv-cac-advanced', 'in_progress', 65, 1200, '{"scrollTop": 800}', NULL, true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

-- Insert completed simulation
INSERT INTO simulations (id, user_id, case_id, status, user_inputs, started_at, completed_at, created_at, updated_at) VALUES
  ('sim-1', 'test-user-1', 'test-case-2', 'completed', 
   '{"decisions": [{"stage": "positioning", "choice": "focus_midmarket", "rationale": "Mid-market offers best balance of price sensitivity and willingness to pay for value"}]}', 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days');

-- Insert debrief for completed simulation
INSERT INTO debriefs (id, simulation_id, scores, summary_text, radar_chart_data, created_at, updated_at) VALUES
  ('debrief-1', 'sim-1', 
   '[{"competency": "Strategic Thinking", "score": 4.2}, {"competency": "Market Awareness", "score": 3.8}, {"competency": "Financial Acumen", "score": 3.5}]',
   'Strong strategic thinking demonstrated with clear market positioning. Good understanding of competitive dynamics. Financial analysis could be more detailed.',
   '{"labels": ["Strategic Thinking", "Market Awareness", "Financial Acumen", "Risk Management", "Leadership Judgment"], "datasets": [{"data": [4.2, 3.8, 3.5, 3.0, 3.2]}]}',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Insert notifications
INSERT INTO notifications (id, user_id, type, title, message, read, link, metadata, created_at, updated_at) VALUES
  ('notif-1', 'test-user-1', 'simulation_complete', 'Simulation Complete!', 'Your Market Positioning Dilemma simulation has been completed. View your debrief to see your performance analysis.', false, '/debrief/sim-1', '{"simulation_id": "sim-1"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('notif-2', 'test-user-1', 'forum_reply', 'New Reply', 'testadmin replied to your thread "Unit Economics Case - Key Insights"', false, '/community/case-studies/thread-2', '{"thread_id": "thread-2", "post_id": "post-3"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('notif-3', 'test-user-1', 'general', 'Welcome to Praxis!', 'Welcome to the Praxis Platform! Complete your first lesson to get started.', true, '/library', '{}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Insert subscription (for test-user-1)
INSERT INTO subscriptions (id, user_id, paddle_subscription_id, paddle_plan_id, status, current_period_start, current_period_end, created_at, updated_at) VALUES
  ('sub-1', 'test-user-1', 'sub_test123', 'plan_test123', 'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

-- Insert user application (for test-user-2)
INSERT INTO user_applications (id, user_id, email, full_name, motivation, background, status, reviewed_by, reviewed_at, notes, created_at, updated_at) VALUES
  ('app-1', 'test-user-2', 'testadmin@example.com', 'Test Admin', 'I want to help build the next generation of business leaders through this platform.', '10+ years in business strategy and operations', 'approved', 'test-user-2', NOW() - INTERVAL '10 days', 'Strong background, approved for admin role', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days');

-- Update sequences to avoid conflicts
SELECT setval('competencies_id_seq', 1000);
SELECT setval('articles_id_seq', 1000);
SELECT setval('cases_id_seq', 1000);
