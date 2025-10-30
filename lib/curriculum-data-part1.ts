// Part 1: Capital Allocation, Competitive Moat Architecture, Global Systems Thinking
export interface LessonData {
  id: string
  number: number
  title: string
  description: string
}

export interface ModuleData {
  id: string
  number: number
  title: string
  description: string
  lessons: LessonData[]
}

export interface DomainData {
  id: string
  title: string
  philosophy: string
  modules: ModuleData[]
}

export const curriculumDataPart1: DomainData[] = [
  {
    id: "capital-allocation",
    title: "Mastery of Capital Allocation",
    philosophy: "Capital allocation is the process of deciding how to deploy the firm's financial resources to generate the highest possible long-term value per share. Every dollar of profit a company generates presents a five-way choice. This curriculum is the study of how to make that choice, again and again, over a decade.",
    modules: [
      {
        id: "ceo-as-investor",
        number: 1,
        title: "The CEO as an Investor: The Foundational Mindset",
        description: "Establishing the fundamental framework for thinking about capital allocation as the CEO's primary responsibility.",
        lessons: [
          {
            id: "five-choices",
            number: 1,
            title: "The Five Choices",
            description: "A rigorous introduction to the only five things a company can do with its capital: 1) Reinvest in the core business (organic growth), 2) Acquire other businesses (inorganic growth), 3) Pay down debt, 4) Issue dividends, and 5) Buy back stock. We will frame the CEO's job as constantly evaluating the risk-adjusted return of these five options."
          },
          {
            id: "per-share-value",
            number: 2,
            title: "The Primacy of Per-Share Value",
            description: "A critical lesson on why gross revenue, profit, or market share are vanity metrics. The only long-term measure that matters is the intrinsic value per share. This module explains why a decision that grows the company but destroys per-share value is a failure of leadership."
          },
          {
            id: "opportunity-cost",
            number: 3,
            title: "Opportunity Cost as a Guiding Principle",
            description: "This lesson drills down on the concept that every capital allocation decision must be benchmarked against all other available options, including the simplest one: buying back your own stock. We will introduce the concept of using the company's own stock as a 'hurdle rate' for all other investments."
          }
        ]
      },
      {
        id: "calculating-intrinsic-value",
        number: 2,
        title: "Calculating Intrinsic Value: The Yardstick for Decision-Making",
        description: "Building the analytical framework for determining what assets and investments are truly worth.",
        lessons: [
          {
            id: "owners-earnings",
            number: 1,
            title: "The Owner's Earnings Framework",
            description: "Moving beyond GAAP net income to calculate a company's true, cash-generating power. This lesson focuses on Warren Buffett's concept of 'Owner Earnings' (Net Income + D&A - Maintenance CapEx) as the real basis for valuation."
          },
          {
            id: "dcf-for-ceo",
            number: 2,
            title: "Discounted Cash Flow (DCF) for the CEO",
            description: "A practical guide to DCF analysis not as a precise tool, but as a framework for understanding the key levers of value: cash flow growth, long-term profitability, and risk (the discount rate)."
          },
          {
            id: "sanity-check-multiples",
            number: 3,
            title: "Sanity Checking Value with Multiples",
            description: "How to use public market comparables (EV/EBITDA, P/E) and precedent transaction analysis not as a primary valuation tool, but as a crucial cross-check to ensure your intrinsic value calculation is grounded in reality."
          }
        ]
      },
      {
        id: "organic-reinvestment",
        number: 3,
        title: "Organic Reinvestment: Analyzing the Core Business",
        description: "Understanding when and how to reinvest in the existing business for maximum value creation.",
        lessons: [
          {
            id: "roic-framework",
            number: 1,
            title: "The Return on Invested Capital (ROIC) Framework",
            description: "ROIC is the single most important metric for measuring the quality of a business and the effectiveness of its management. This lesson provides a guide to calculating and interpreting ROIC."
          },
          {
            id: "growth-vs-roic",
            number: 2,
            title: "The Growth vs. ROIC Matrix",
            description: "A framework for making reinvestment decisions. This module explains why reinvesting in a high-ROIC business is the most powerful way to create value, and why reinvesting in a low-ROIC business destroys it, even if it leads to growth."
          },
          {
            id: "maintenance-vs-growth-capex",
            number: 3,
            title: "Maintenance CapEx vs. Growth CapEx",
            description: "A critical distinction for understanding a company's true reinvestment needs. This lesson explains how to separate the capital required to simply maintain the business from the capital being deployed to grow it, providing a clearer picture of reinvestment efficiency."
          }
        ]
      },
      {
        id: "acquisitions",
        number: 4,
        title: "Acquisitions: The High-Stakes Path to Growth",
        description: "Mastering the art and science of acquiring other businesses to create value.",
        lessons: [
          {
            id: "build-vs-buy",
            number: 1,
            title: "The Build vs. Buy Decision Framework",
            description: "A structured guide for when to pursue an acquisition. This lesson covers the key strategic rationales: acquiring technology, entering a new market, consolidating an industry, or buying a high-ROIC business to redeploy capital."
          },
          {
            id: "accretive-deal-arithmetic",
            number: 2,
            title: "The Arithmetic of an Accretive Deal",
            description: "A non-technical explanation of accretion/dilution analysis. This lesson teaches a CEO how to quickly assess whether a deal is likely to increase or decrease earnings per share, and more importantly, why that metric can often be misleading."
          },
          {
            id: "winners-curse",
            number: 3,
            title: "The Winner's Curse and Bidding Discipline",
            description: "An analysis of the behavioral biases that lead CEOs to overpay for acquisitions. This lesson focuses on the importance of setting a firm walk-away price based on intrinsic value and maintaining discipline in a competitive auction process."
          }
        ]
      },
      {
        id: "debt-management",
        number: 5,
        title: "Debt Management: A Tool for Value, Not a Source of Fear",
        description: "Understanding how to use debt strategically as part of optimal capital structure.",
        lessons: [
          {
            id: "leverage-role",
            number: 1,
            title: "The Role of Leverage in the Capital Structure",
            description: "This lesson explains how debt can be used strategically to magnify returns on equity (the concept of leverage). It introduces the framework of an optimal capital structure, balancing the tax advantages of debt against its financial risks."
          },
          {
            id: "covenants-flexibility",
            number: 2,
            title: "Covenants, Credit Ratings, and Financial Flexibility",
            description: "A practical guide to the constraints that come with debt. This lesson explains how debt covenants and a company's credit rating impact its operational and strategic freedom, and why maintaining financial flexibility is a key CEO responsibility."
          }
        ]
      },
      {
        id: "share-buybacks",
        number: 6,
        title: "Share Buybacks: The Most Misunderstood Tool",
        description: "Mastering the strategic use of share repurchases to create value.",
        lessons: [
          {
            id: "buyback-mathematics",
            number: 1,
            title: "The Mathematics of a Share Repurchase",
            description: "A clear explanation of why buybacks increase per-share value. This lesson shows that a buyback is functionally equivalent to the company reinvesting in itself at the current market price."
          },
          {
            id: "price-value-discipline",
            number: 2,
            title: "The Price-Value Discipline",
            description: "The central lesson on buybacks: they are only intelligent when the company's stock is trading below its calculated intrinsic value. A buyback above intrinsic value destroys value just as surely as a bad acquisition."
          },
          {
            id: "signaling-perception",
            number: 3,
            title: "Signaling and Market Perception",
            description: "An analysis of the non-financial aspects of buybacks. This lesson covers how buybacks are perceived by the market, their use as a signaling mechanism, and the political and social pressures surrounding them."
          }
        ]
      },
      {
        id: "dividends",
        number: 7,
        title: "Dividends: The Commitment to Return Capital",
        description: "Understanding when and how to use dividends as a capital allocation tool.",
        lessons: [
          {
            id: "dividends-stability",
            number: 1,
            title: "Dividends as a Signal of Stability and Discipline",
            description: "This lesson explains the role of a dividend policy in attracting a certain class of investor and imposing a sense of capital discipline on management."
          },
          {
            id: "dividend-vs-buyback",
            number: 2,
            title: "The Dividend vs. Buyback Decision Framework",
            description: "A direct comparison of the two primary methods of returning capital to shareholders. This lesson covers the key differences in flexibility (dividends are hard to cut) and tax efficiency (buybacks are generally more efficient)."
          }
        ]
      },
      {
        id: "capital-allocation-plan",
        number: 8,
        title: "The Capital Allocation Plan: A Formal Document",
        description: "Creating a systematic approach to capital allocation decisions.",
        lessons: [
          {
            id: "codifying-philosophy",
            number: 1,
            title: "Codifying Your Philosophy",
            description: "This lesson guides the user in creating a formal, written Capital Allocation Plan. This document serves as a constitution for decision-making, clearly articulating the company's philosophy and priorities to the board and to investors."
          },
          {
            id: "communicating-annual-report",
            number: 2,
            title: "Communicating the Plan in the Annual Report",
            description: "An analysis of how great capital allocators (like Buffett) use their annual shareholder letter to educate their investors about their long-term approach to capital deployment."
          }
        ]
      },
      {
        id: "measuring-performance",
        number: 9,
        title: "Measuring Performance: Scorecards for the CEO",
        description: "Establishing metrics and timeframes for evaluating capital allocation success.",
        lessons: [
          {
            id: "three-five-year-test",
            number: 1,
            title: "The Three- and Five-Year Test",
            description: "This lesson explains that the success of a capital allocation decision (especially an acquisition) cannot be judged in a single quarter. It provides a framework for evaluating the performance of major decisions over a multi-year time horizon."
          },
          {
            id: "benchmarking-index",
            number: 2,
            title: "Benchmarking Against the Index",
            description: "A hard-nosed look at performance. This lesson argues that if a CEO cannot generate a higher per-share value growth than a simple S&P 500 index fund over a five-year period, the shareholders would have been better off if the company had just liquidated and returned the cash."
          }
        ]
      },
      {
        id: "advanced-topics",
        number: 10,
        title: "Advanced Topics: Spinoffs, Divestitures, and Restructuring",
        description: "Advanced capital allocation techniques for complex situations.",
        lessons: [
          {
            id: "spinoffs-value",
            number: 1,
            title: "Spinoffs as a Tool to Unlock Value",
            description: "This lesson covers the strategic rationale for spinning off a business unit into a separate, publicly-traded company to eliminate a 'conglomerate discount'."
          },
          {
            id: "art-divestiture",
            number: 2,
            title: "The Art of the Divestiture",
            description: "A guide to selling non-core assets. This lesson explains how selling a business unit can be a powerful act of capital allocation, freeing up resources to reinvest in the higher-ROIC core business."
          }
        ]
      },
      {
        id: "psychology-capital-allocation",
        number: 11,
        title: "The Psychology of Capital Allocation: Overcoming Bias",
        description: "Understanding and overcoming the behavioral biases that lead to poor capital allocation.",
        lessons: [
          {
            id: "action-imperative",
            number: 1,
            title: "The 'Action Imperative': Overcoming the Bias for Empire-Building",
            description: "An analysis of the institutional pressures and personal biases that lead CEOs to favor value-destroying acquisitions over 'boring' but value-creating buybacks."
          },
          {
            id: "anchoring-confirmation-bias",
            number: 2,
            title: "Anchoring, Confirmation Bias, and the CEO",
            description: "A look at how common cognitive biases can distort major investment decisions, and the systems (like pre-mortems and formal checklists) that can be used to counteract them."
          }
        ]
      },
      {
        id: "integrated-case-study",
        number: 12,
        title: "The Integrated Case Study: A CEO's First Five Years",
        description: "Applying capital allocation principles through a comprehensive case study.",
        lessons: [
          {
            id: "year-1-inheritance",
            number: 1,
            title: "Year 1 - The Inheritance",
            description: "Analyzing the capital structure and investment opportunities of a newly inherited company."
          },
          {
            id: "year-3-crossroads",
            number: 2,
            title: "Year 3 - The Crossroads",
            description: "Facing a major decision between a large acquisition, a massive buyback, and a special dividend."
          },
          {
            id: "year-5-reckoning",
            number: 3,
            title: "Year 5 - The Reckoning",
            description: "Evaluating the results of the decisions made over the five-year period and setting the capital allocation strategy for the next five."
          }
        ]
      }
    ]
  },
  {
    id: "competitive-moat-architecture",
    title: "Competitive Moat Architecture",
    philosophy: "A competitive moat is a structural advantage that protects a company from competitors, allowing it to sustain high returns on invested capital over a long period. The CEO's job is not just to compete, but to architect these moats, making the business durably difficult to assail.",
    modules: [
      {
        id: "foundational-theory",
        number: 1,
        title: "The Foundational Theory of Economic Moats",
        description: "Understanding what constitutes a true competitive moat versus temporary advantages.",
        lessons: [
          {
            id: "defining-moat",
            number: 1,
            title: "Defining the Moat: Differentiating True Moats from Fleeting Advantages",
            description: "A critical first lesson on the difference between a durable, structural moat and temporary advantages like a great product, a strong marketing campaign, or operational excellence. We establish the primary litmus test: does this advantage protect long-term profits (high ROIC)?"
          },
          {
            id: "source-all-moats",
            number: 2,
            title: "The Source of All Moats: High Returns on Invested Capital (ROIC)",
            description: "This lesson establishes the direct, causal link between a company's ability to generate high ROIC and the existence of a moat. We frame the moat's purpose as the 'wall' that prevents competitors from flooding in and competing those high returns down to average."
          },
          {
            id: "moats-industry-structure",
            number: 3,
            title: "The Relationship Between Moats and Industry Structure",
            description: "An analysis of how industry structure (using frameworks like Porter's Five Forces) creates the environment in which moats can be built. Some industries are structurally more conducive to moats than others."
          }
        ]
      },
      {
        id: "network-effects",
        number: 2,
        title: "Moat #1 - Network Effects",
        description: "Understanding and building the most powerful modern competitive moat.",
        lessons: [
          {
            id: "physics-network-effects",
            number: 1,
            title: "The Physics of Network Effects: Direct vs. Indirect",
            description: "A detailed deconstruction of the most powerful modern moat. This lesson explains direct network effects (e.g., a telephone network, where each new user adds value to all others) and indirect/two-sided network effects (e.g., Uber, where more riders attract more drivers, which attracts more riders)."
          },
          {
            id: "architecting-liquidity",
            number: 2,
            title: "Architecting for Liquidity: The 'Cold Start' Problem",
            description: "The hardest part of building a network effect moat is getting it started. This lesson analyzes the strategies used to solve the 'cold start' problem, such as subsidizing one side of the market or focusing on a hyper-niche to achieve critical mass."
          },
          {
            id: "asymptotic-network-effect",
            number: 3,
            title: "The Asymptotic Network Effect: When Networks Stop Growing in Value",
            description: "An advanced lesson on the limits of network effects. We analyze why some networks (like Facebook in its early days) have accelerating returns, while others reach a point of saturation where a new user adds only marginal value."
          }
        ]
      },
      {
        id: "intangible-assets",
        number: 3,
        title: "Moat #2 - Intangible Assets",
        description: "Leveraging brands, patents, and regulatory advantages as competitive moats.",
        lessons: [
          {
            id: "brands-as-moat",
            number: 1,
            title: "Brands as a Moat: The Psychology of Reduced Search Costs",
            description: "This lesson explains that a brand is only a moat if it either 1) inspires a willingness to pay a premium price (e.g., Apple, Tiffany & Co.) or 2) saves the consumer mental effort and search costs (e.g., Coca-Cola, Heinz). A brand that is merely well-known is not a moat."
          },
          {
            id: "patents-ip",
            number: 2,
            title: "Patents & Intellectual Property: A Finite but Powerful Advantage",
            description: "A look at the role of patents in creating temporary, government-sanctioned monopolies. We analyze how pharmaceutical and technology companies build and defend their patent portfolios."
          },
          {
            id: "regulatory-capture",
            number: 3,
            title: "Regulatory Capture & Licenses: The Government-Granted Moat",
            description: "An analysis of how some companies build moats by securing exclusive government licenses or by embedding themselves so deeply in a regulated industry that compliance costs become a barrier to entry for new players."
          }
        ]
      },
      {
        id: "switching-costs",
        number: 4,
        title: "Moat #3 - Switching Costs",
        description: "Creating customer lock-in through various forms of switching costs.",
        lessons: [
          {
            id: "three-types-switching-costs",
            number: 1,
            title: "The Three Types of Switching Costs",
            description: "A breakdown of the different ways companies 'lock in' their customers: 1) Procedural (learning a new system, like the Adobe Creative Suite), 2) Financial (exit fees, loss of discounts), and 3) Relational (loss of a trusted human relationship, common in B2B sales)."
          },
          {
            id: "designing-high-switching-costs",
            number: 2,
            title: "Designing for High Switching Costs: The Enterprise Software Playbook",
            description: "An analysis of how companies like Oracle, Salesforce, and Microsoft build deep, systemic moats by integrating their products into the core workflows of their customers, making them incredibly difficult and costly to rip out."
          },
          {
            id: "data-switching-cost",
            number: 3,
            title: "Data as a Switching Cost",
            description: "An examination of how a user's accumulated data within a platform (e.g., your historical data in an accounting software, your playlists in Spotify) creates a powerful form of lock-in and a personalized user experience that competitors cannot easily replicate."
          }
        ]
      },
      {
        id: "cost-advantages",
        number: 5,
        title: "Moat #4 - Cost Advantages",
        description: "Building sustainable cost advantages that competitors cannot match.",
        lessons: [
          {
            id: "process-power",
            number: 1,
            title: "Process Power: The Toyota & Southwest Airlines Model",
            description: "This lesson explains how a unique, hard-to-replicate business process can create a durable cost advantage even if competitors have access to the same resources. It's about how the pieces are put together."
          },
          {
            id: "economies-of-scale",
            number: 2,
            title: "Economies of Scale: The Power of Size",
            description: "A classic analysis of how scale advantages in purchasing, manufacturing, and distribution lead to a lower per-unit cost structure that smaller competitors cannot match (e.g., Walmart, Amazon's logistics)."
          },
          {
            id: "unique-assets",
            number: 3,
            title: "Unique Assets: The Geographic & Resource-Based Moat",
            description: "A look at cost advantages derived from controlling a unique, scarce asset, whether it's a strategically located quarry for a materials company or a portfolio of unique content for a media company."
          }
        ]
      },
      {
        id: "identifying-moats",
        number: 6,
        title: "Identifying Moats: The Analyst's Toolkit",
        description: "Developing the skills to recognize moats in existing businesses.",
        lessons: [
          {
            id: "qualitative-signals",
            number: 1,
            title: "Qualitative Signals: Reading the Language of Moats",
            description: "This lesson teaches a CEO how to identify the presence of a moat by analyzing a company's language. Do they talk about price, or do they talk about value? Do they focus on features, or do they focus on their ecosystem?"
          },
          {
            id: "quantitative-signals",
            number: 2,
            title: "Quantitative Signals: The Financial Footprint of a Moat",
            description: "A guide to identifying moats by looking at the numbers. We analyze the financial signatures of a strong moat: consistently high and stable Gross Margins, high ROIC, and low capital intensity."
          }
        ]
      },
      {
        id: "widening-moat",
        number: 7,
        title: "Widening the Moat: A CEO's Strategic Imperative",
        description: "Strategies for strengthening and expanding competitive advantages over time.",
        lessons: [
          {
            id: "capital-allocation-moat-building",
            number: 1,
            title: "Capital Allocation as a Moat-Building Tool",
            description: "This lesson connects directly to the Capital Allocation domain. It frames every investment decision through the lens of the moat: 'Does this acquisition widen our network effect? Does this R&D project strengthen our patent portfolio? Does this CapEx deepen our cost advantage?'"
          },
          {
            id: "flywheel-effect",
            number: 2,
            title: "The Flywheel Effect: Using Momentum to Widen the Moat",
            description: "An analysis of Amazon's famous flywheel concept. This lesson explains how high-performing companies design their business model so that each component reinforces the others, creating a self-perpetuating cycle that naturally widens the moat over time."
          }
        ]
      },
      {
        id: "attacking-eroding-moats",
        number: 8,
        title: "Attacking and Eroding Moats",
        description: "Understanding how moats are breached and how to defend against attacks.",
        lessons: [
          {
            id: "christensen-model",
            number: 1,
            title: "The Christensen Model: Disruptive Innovation",
            description: "A deep dive into how moats are most often breached—not by a frontal assault, but by a disruptive innovation that attacks the low end of the market or creates a new market entirely, making the incumbent's moat irrelevant."
          },
          {
            id: "technological-change-destroyer",
            number: 2,
            title: "Technological Change as a Moat-Destroyer",
            description: "An analysis of historical examples where a major technological shift (e.g., the shift from mainframes to PCs, from on-premise software to the cloud) completely eroded the moats of dominant incumbents."
          },
          {
            id: "moat-in-moat-fallacy",
            number: 3,
            title: "The 'Moat-in-a-Moat' Fallacy: When Great Businesses Go Bad",
            description: "An examination of companies that had powerful moats but destroyed them through poor capital allocation, operational neglect, or a failure to adapt (e.g., Kodak)."
          }
        ]
      },
      {
        id: "portfolio-moats",
        number: 9,
        title: "The Portfolio of Moats: Advanced Strategy",
        description: "Managing multiple moats and complex business portfolios.",
        lessons: [
          {
            id: "layering-moats",
            number: 1,
            title: "Layering Moats: The Ultimate Defensive Strategy",
            description: "The most durable companies are not protected by a single moat, but by multiple, overlapping moats. This lesson analyzes how companies like Microsoft layer network effects (Windows/Office), high switching costs (enterprise software), and brand to create a nearly unbreachable fortress."
          },
          {
            id: "managing-portfolio-businesses",
            number: 2,
            title: "Managing a Portfolio of Businesses with Different Moats",
            description: "For CEOs of conglomerates or large, multi-division companies. This lesson provides a framework for how to manage and allocate capital to a portfolio of businesses, each with a different type and strength of moat (e.g., the BCG Matrix re-framed through the lens of moats)."
          }
        ]
      }
    ]
  },
  {
    id: "global-systems-thinking",
    title: "Global Systems Thinking",
    philosophy: "A multinational corporation is not a machine; it is a complex adaptive system. Its success depends not on managing individual parts, but on understanding the dynamic relationships, feedback loops, and second-order effects that govern the whole. The CEO's job is to be the architect and chief regulator of this global system.",
    modules: [
      {
        id: "foundations-systems-thinking",
        number: 1,
        title: "The Foundations of Systems Thinking",
        description: "Building the fundamental mental models for understanding complex systems.",
        lessons: [
          {
            id: "stocks-flows-feedback",
            number: 1,
            title: "Stocks, Flows, and Feedback Loops",
            description: "The fundamental building blocks of any system. This lesson introduces the core vocabulary: 'Stocks' (accumulations of things, like inventory, cash, or employee morale), 'Flows' (the rates at which stocks change), and 'Feedback Loops' (the mechanisms that cause a system's behavior to reinforce or correct itself)."
          },
          {
            id: "reinforcing-vs-balancing",
            number: 2,
            title: "Reinforcing vs. Balancing Loops: The Engines of Growth and Stability",
            description: "A deep dive into the two types of feedback loops. Reinforcing loops create exponential growth or collapse (e.g., viral product growth, a death spiral of employee attrition). Balancing loops seek stability and equilibrium (e.g., a thermostat, a well-managed supply chain). A CEO must be able to identify and influence these loops."
          },
          {
            id: "delays-oscillations-beer-game",
            number: 3,
            title: "Delays, Oscillations, and the 'Beer Game'",
            description: "A critical lesson on the role of time delays in systems. We will deconstruct the famous 'Beer Game' simulation from MIT, which demonstrates how small delays in a supply chain inevitably lead to massive oscillations (the 'bullwhip effect'), causing chronic over- and under-stocking."
          }
        ]
      },
      {
        id: "organization-as-system",
        number: 2,
        title: "The Organization as a System",
        description: "Understanding how organizational structure creates systemic behaviors.",
        lessons: [
          {
            id: "conways-law",
            number: 1,
            title: "Conway's Law as a Systemic Force",
            description: "This lesson reframes Conway's Law ('Any organization that designs a system will produce a design whose structure is a copy of the organization's communication structure') as an immutable law of corporate physics. It demonstrates how a fragmented organizational structure will inevitably produce a fragmented product and customer experience."
          },
          {
            id: "unintended-consequences",
            number: 2,
            title: "Unintended Consequences: The Cobra Effect and Perverse Incentives",
            description: "An analysis of how poorly designed incentives and KPIs can create disastrous, unintended outcomes (the 'Cobra Effect'). This lesson provides a framework for designing 'system-aware' incentives that align individual actions with the health of the overall system."
          },
          {
            id: "organizational-dysfunction-archetypes",
            number: 3,
            title: "Archetypes of Organizational Dysfunction",
            description: "An introduction to common systems archetypes as they apply to companies. This includes 'Shifting the Burden' (solving a symptom instead of the root cause, leading to long-term addiction to short-term fixes) and 'Tragedy of the Commons' (when teams optimize for their own goals, depleting shared resources)."
          }
        ]
      },
      {
        id: "global-supply-chain-system",
        number: 3,
        title: "The Global Supply Chain as a System",
        description: "Understanding supply chains as complex, interconnected systems.",
        lessons: [
          {
            id: "efficiency-vs-resilience",
            number: 1,
            title: "The Trade-off Between Efficiency and Resilience",
            description: "This lesson deconstructs the modern 'just-in-time' supply chain as a highly optimized but fragile system. It analyzes how decades of prioritizing cost efficiency have created systemic vulnerabilities to shocks (pandemics, geopolitical events, canal blockages)."
          },
          {
            id: "modeling-systemic-risk",
            number: 2,
            title: "Modeling Systemic Risk: Choke Points, Dependencies, and Cascading Failures",
            description: "A guide to mapping a global supply chain not as a linear chain, but as a network. This lesson provides a framework for identifying hidden choke points (e.g., a single supplier for a critical component) and modeling how a failure in one node can cascade through the entire system."
          },
          {
            id: "designing-antifragility",
            number: 3,
            title: "Designing for Antifragility: The Role of Redundancy and Decentralization",
            description: "The playbook for building a resilient supply chain. This lesson covers the strategic use of multi-sourcing, geographic diversification of manufacturing, and maintaining buffer inventory—not as costs, but as insurance policies against systemic disruption."
          }
        ]
      },
      {
        id: "market-as-ecosystem",
        number: 4,
        title: "The Market as an Ecosystem",
        description: "Understanding markets as complex ecosystems with multiple interdependent actors.",
        lessons: [
          {
            id: "platforms-aggregators-ecosystem",
            number: 1,
            title: "Platforms, Aggregators, and Ecosystem Dynamics",
            description: "This lesson moves beyond viewing the market as a simple collection of buyers and sellers. It provides a framework for understanding the market as a complex ecosystem with different roles (producers, consumers, platform providers). It analyzes how companies like Apple and Google act as 'keystone species,' shaping the health and evolution of the entire ecosystem."
          },
          {
            id: "second-order-effects-decisions",
            number: 2,
            title: "Second-Order Effects of Strategic Decisions",
            description: "A critical thinking module. A price cut may increase short-term sales (first-order effect), but it may also trigger a price war that destroys industry profits and devalues the brand (second-order effects). This lesson provides a disciplined mental model for thinking through the chain of consequences before making a major market move."
          },
          {
            id: "unintended-audiences",
            number: 3,
            title: "The Law of Unintended Audiences",
            description: "In a global, interconnected market, every action and communication will be seen by audiences it was not intended for. This lesson analyzes how a marketing campaign in one country can create a PR crisis in another, or how an internal memo can leak and impact investor perceptions."
          }
        ]
      },
      {
        id: "geopolitical-system",
        number: 5,
        title: "The Geopolitical System",
        description: "Understanding how nation-states operate as system actors affecting business.",
        lessons: [
          {
            id: "nation-state-system-actor",
            number: 1,
            title: "The Nation-State as a System Actor",
            description: "This lesson frames countries not just as markets, but as actors with their own systemic goals, feedback loops, and incentives (e.g., economic growth, social stability, national security). It provides a high-level guide to understanding the differing operating systems of major geopolitical blocs (e.g., the US, China, the EU)."
          },
          {
            id: "regulatory-arbitrage",
            number: 2,
            title: "Regulatory Arbitrage and Systemic Constraints",
            description: "An analysis of how multinational corporations navigate the differing rules of the global system. This covers how decisions about where to domicile intellectual property, locate data centers (data sovereignty), and declare profits are driven by the search for efficiencies within a complex and often contradictory global regulatory system."
          },
          {
            id: "geopolitical-risk-shock",
            number: 3,
            title: "Geopolitical Risk as a Systemic Shock",
            description: "This lesson models geopolitical events (trade wars, sanctions, conflicts) as external shocks to the business system. It provides a framework for identifying the company's exposure to these risks and developing strategies to hedge against them, such as diversifying political exposure and creating firewalls between regional business units."
          }
        ]
      },
      {
        id: "technological-system",
        number: 6,
        title: "The Technological System",
        description: "Understanding technology as a system-wide force that reshapes entire industries.",
        lessons: [
          {
            id: "general-purpose-technologies",
            number: 1,
            title: "General Purpose Technologies (GPTs) as System-Wide Disruptors",
            description: "An analysis of how certain technologies (like the steam engine, electricity, the internet, and now AI) are not just new products, but systemic enablers that reshape the entire global economy. This lesson focuses on identifying the second and third-order effects of these technologies on supply chains, labor markets, and consumer behavior."
          },
          {
            id: "standards-protocols-platform-power",
            number: 2,
            title: "Standards, Protocols, and Platform Power",
            description: "A look at the 'rules of the game' in the technological system. This lesson explains why controlling a technical standard (like USB-C) or a platform protocol (like TCP/IP or the iOS App Store rules) is a source of immense systemic power, allowing a company to influence the entire ecosystem."
          }
        ]
      },
      {
        id: "synthesizing-worldview",
        number: 7,
        title: "Synthesizing a Worldview: The CEO's Dashboard",
        description: "Integrating systems thinking into executive decision-making processes.",
        lessons: [
          {
            id: "leading-vs-lagging-indicators",
            number: 1,
            title: "Leading Indicators vs. Lagging Indicators",
            description: "A crucial lesson for navigating complexity. A CEO must learn to differentiate between lagging indicators that report on the past (e.g., quarterly financial results) and leading indicators that provide a signal about the future health of the system (e.g., customer satisfaction scores, employee engagement, R&D pipeline velocity)."
          },
          {
            id: "building-mental-model",
            number: 2,
            title: "Building a 'Mental Model' of the Business System",
            description: "This capstone lesson guides the user in synthesizing all previous modules into a single, coherent mental model of their business as it exists within the wider global system. It focuses on the practice of constantly updating this model with new information and using it as the primary tool for making high-level strategic decisions."
          }
        ]
      }
    ]
  }
]
