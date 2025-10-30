// Part 2: Organizational Design & Talent Density, High-Stakes Dealmaking & Integration, Investor & Market Narrative Control
import { DomainData } from './curriculum-data-part1'

export const curriculumDataPart2: DomainData[] = [
  {
    id: "organizational-design-talent-density",
    title: "Organizational Design & Talent Density",
    philosophy: "The goal of organizational design is not to create a tidy org chart, but to build a system that maximizes the velocity and quality of decision-making. This system is fueled by talent density—the principle that a smaller number of high-impact individuals is exponentially more valuable than a larger number of average performers. The CEO's job is to design the machine and then staff it with the best possible people.",
    modules: [
      {
        id: "foundational-theories-structure",
        number: 1,
        title: "The Foundational Theories of Organizational Structure",
        description: "Understanding the fundamental principles that govern organizational design.",
        lessons: [
          {
            id: "speed-vs-control",
            number: 1,
            title: "The Core Trade-off: Speed vs. Control",
            description: "An introduction to the fundamental tension in all organizational design. This lesson analyzes the trade-offs between highly centralized, functional structures (optimized for control and efficiency) and decentralized, divisional structures (optimized for speed and market responsiveness)."
          },
          {
            id: "dunbars-number",
            number: 2,
            title: "Dunbar's Number & The Limits of Social Cohesion",
            description: "An analysis of the anthropological and sociological constraints on team and company size. This lesson explains why communication and cohesion inevitably break down as groups grow past certain thresholds (like the famous ~150 number), and the structural changes required to counteract this."
          },
          {
            id: "strategy-structure-relationship",
            number: 3,
            title: "The Relationship Between Strategy and Structure",
            description: "This lesson establishes the principle that structure must always follow strategy. A strategy focused on product innovation requires a different organizational structure than a strategy focused on operational excellence. We analyze how a mismatch between strategy and structure is a primary cause of corporate failure."
          }
        ]
      },
      {
        id: "three-archetypes-design",
        number: 2,
        title: "The Three Archetypes of Organizational Design",
        description: "Understanding the fundamental organizational structures and their trade-offs.",
        lessons: [
          {
            id: "functional-organization",
            number: 1,
            title: "The Functional Organization (The Machine)",
            description: "A deep dive into the traditional, siloed structure (e.g., a single VP of Engineering, a single VP of Marketing). We analyze its strengths (deep functional expertise, economies of scale) and its weaknesses (slow decision-making, lack of clear ownership, inter-departmental conflict)."
          },
          {
            id: "divisional-organization",
            number: 2,
            title: "The Divisional Organization (The Portfolio)",
            description: "An analysis of the structure used by most large, multi-product companies (e.g., a General Manager for 'Product A,' a GM for 'Product B,' each with their own dedicated resources). We analyze its strengths (clear P&L ownership, speed) and weaknesses (resource duplication, potential for internal competition)."
          },
          {
            id: "matrix-organization",
            number: 3,
            title: "The Matrix Organization (The Compromise)",
            description: "A look at the complex hybrid model that attempts to combine the benefits of functional and divisional structures. This lesson provides an honest assessment of the matrix's theoretical benefits and its practical, real-world challenges, such as conflicting priorities and the 'two-boss problem'."
          }
        ]
      },
      {
        id: "modern-organizational-paradigms",
        number: 3,
        title: "Modern Organizational Paradigms",
        description: "Exploring contemporary approaches to organizational design.",
        lessons: [
          {
            id: "spotify-model",
            number: 1,
            title: "The Spotify Model: 'Squads, Tribes, Chapters, and Guilds'",
            description: "A deconstruction of the influential agile-at-scale model. This lesson focuses on the core principles: autonomous, cross-functional teams (Squads) that are loosely coupled but tightly aligned on mission."
          },
          {
            id: "amazon-model",
            number: 2,
            title: "The Amazon Model: 'Two-Pizza Teams' and Separable Services",
            description: "An analysis of how Amazon's organizational structure is a direct reflection of its service-oriented technical architecture. This lesson explains the concept of small, independent teams with single-threaded leaders who 'own' a specific service, interacting with other teams via clear APIs."
          },
          {
            id: "haier-model",
            number: 3,
            title: "The Haier Model: Rendanheyi and the Micro-Enterprise",
            description: "An advanced look at the radical, decentralized model of turning a massive company into a dynamic ecosystem of independent, customer-facing 'micro-enterprises'."
          }
        ]
      },
      {
        id: "principle-talent-density",
        number: 4,
        title: "The Principle of Talent Density",
        description: "Understanding and implementing the philosophy of talent density.",
        lessons: [
          {
            id: "netflix-philosophy",
            number: 1,
            title: "The Netflix Philosophy: 'Adequate Performance Gets a Generous Severance'",
            description: "A rigorous examination of the talent density concept. This lesson explains the logic that high performance is contagious, and that the cost of retaining an average performer is not just their salary, but the drag they place on the entire team's effectiveness."
          },
          {
            id: "mathematics-top-performers",
            number: 2,
            title: "The Mathematics of Top Performers: The Power Law Distribution of Output",
            description: "An analysis of the research showing that in creative and technical roles, the output of the top 1% is not just incrementally better, but orders of magnitude better than the average. This provides the quantitative justification for a talent-density-focused strategy."
          },
          {
            id: "compensation-strategy",
            number: 3,
            title: "The Compensation Strategy for Talent Density: Paying Top of Market",
            description: "This lesson connects organizational philosophy to compensation. It explains why a 'Top of Market' pay strategy is not a cost, but an investment required to attract and retain the talent density that drives disproportionate results."
          }
        ]
      },
      {
        id: "ceo-toolkit-talent-density",
        number: 5,
        title: "The CEO's Toolkit for Cultivating Talent Density",
        description: "Practical tools and processes for building and maintaining talent density.",
        lessons: [
          {
            id: "hiring-process-core-business",
            number: 1,
            title: "The Hiring Process as a Core Business Process",
            description: "This lesson reframes hiring from an HR function to a critical, CEO-led operational process. It provides a framework for designing a rigorous, standardized interview process that is optimized to identify high-impact individuals, not just to fill open roles."
          },
          {
            id: "performance-review-differentiation",
            number: 2,
            title: "The Performance Review as a Mechanism for Differentiation",
            description: "A guide to designing a performance management system that is not about bureaucracy, but about clearly and honestly differentiating performance levels. This lesson covers the pros and cons of different systems (e.g., forced rankings, calibration committees) as tools for enforcing a high-performance culture."
          },
          {
            id: "art-firing-well",
            number: 3,
            title: "The Art of Firing Well: Managing Exits with Candor and Respect",
            description: "A difficult but essential CEO skill. This lesson provides a playbook for removing employees who are not meeting the performance bar in a way that is respectful to the individual but clear and reinforcing to the rest of the organization."
          }
        ]
      },
      {
        id: "information-flow-decision-making",
        number: 6,
        title: "Information Flow and Decision-Making",
        description: "Designing organizational systems for optimal information flow and decision velocity.",
        lessons: [
          {
            id: "high-velocity-decisions",
            number: 1,
            title: "Designing for High-Velocity Decisions",
            description: "This lesson analyzes the organizational structures and processes that either accelerate or impede the speed and quality of decision-making. It covers concepts like assigning 'single, accountable owners' for decisions and the 'disagree and commit' principle."
          },
          {
            id: "ceo-chief-information-officer",
            number: 2,
            title: "The CEO's Role as Chief Information Officer",
            description: "The CEO's most important function in this context is to design the systems of information flow. This lesson provides a guide to designing the key communication forums (e.g., the weekly business review, the quarterly strategy offsite) that ensure the right information gets to the right people at the right time."
          }
        ]
      },
      {
        id: "incentives-alignment",
        number: 7,
        title: "Incentives and Alignment",
        description: "Creating incentive systems that align individual and organizational goals.",
        lessons: [
          {
            id: "power-equity",
            number: 1,
            title: "The Power of Equity: Aligning Employees with Long-Term Value Creation",
            description: "A deep dive into the strategic use of stock options and RSUs. This lesson explains how broad-based equity ownership is the most powerful tool for aligning the entire organization around the goal of increasing long-term, per-share value."
          },
          {
            id: "designing-bonus-structures",
            number: 2,
            title: "Designing Bonus Structures that Don't Break the System",
            description: "An analysis of how to design short-term incentive plans (bonuses) that reward the right behaviors without creating perverse incentives or encouraging teams to optimize their own metrics at the expense of the company."
          }
        ]
      },
      {
        id: "evolving-organization",
        number: 8,
        title: "The Evolving Organization",
        description: "Managing organizational change and evolution over time.",
        lessons: [
          {
            id: "re-orgs-tool-last-resort",
            number: 1,
            title: "Re-Orgs: The Tool of Last Resort",
            description: "A playbook for when and how to execute a corporate reorganization. This lesson covers the high costs of re-orgs (productivity loss, employee anxiety) and provides a checklist for ensuring a re-org is done for the right strategic reasons and managed effectively."
          },
          {
            id: "managing-growth-transitions",
            number: 2,
            title: "Managing Growth: The Transition from Startup to Scale-Up to Enterprise",
            description: "This capstone lesson analyzes the predictable organizational breaking points that occur as a company grows (e.g., from 50 to 150 people, from 500 to 2000). It provides a high-level guide to the structural and cultural changes a CEO must lead at each stage of the company's evolution."
          }
        ]
      }
    ]
  },
  {
    id: "high-stakes-dealmaking-integration",
    title: "High-Stakes Dealmaking & Integration",
    philosophy: "A major transaction is not a financial event; it is the most potent and dangerous tool for executing corporate strategy. Success is not defined by closing the deal, but by creating tangible, long-term, per-share value years after the ink is dry. The CEO is the ultimate owner of this entire process, from thesis to results.",
    modules: [
      {
        id: "strategic-rationale",
        number: 1,
        title: "Strategic Rationale: The 'Why' Behind the Deal",
        description: "Establishing the strategic foundation for any major transaction.",
        lessons: [
          {
            id: "dealmaking-tool-strategy",
            number: 1,
            title: "Dealmaking as a Tool of Strategy, Not a Strategy Itself",
            description: "The foundational lesson. An acquisition must be the answer to a clear strategic question. This lesson provides a framework for when a deal is the only or best answer, forcing a rigorous analysis of alternatives."
          },
          {
            id: "build-buy-partner-framework",
            number: 2,
            title: "The Build vs. Buy vs. Partner Framework",
            description: "A disciplined, quantitative, and qualitative guide to making the core decision. We analyze the trade-offs in speed, cost, risk, and control for each path."
          },
          {
            id: "five-archetypes-strategic-deals",
            number: 3,
            title: "The Five Archetypes of Strategic Deals",
            description: "A breakdown of the primary strategic intents: 1) Market Consolidation, 2) Acquiring New Technology or Capabilities, 3) Geographic Expansion, 4) Buying a Growth Engine, and 5) The 'Acqui-hire' for talent."
          }
        ]
      },
      {
        id: "target-identification-thesis",
        number: 2,
        title: "Target Identification & Thesis Development",
        description: "The systematic process of identifying and evaluating potential acquisition targets.",
        lessons: [
          {
            id: "corporate-development-function",
            number: 1,
            title: "The Corporate Development Function",
            description: "A guide to building and managing the internal team (or hiring the external advisors) responsible for sourcing and evaluating opportunities. This is about designing the 'deal machine' for the company."
          },
          {
            id: "broad-scan-target-shortlist",
            number: 2,
            title: "From Broad Scan to Target Shortlist",
            description: "A playbook for moving from a wide-angle market scan to a defensible shortlist of potential targets. This covers the use of financial screens, strategic fit analysis, and human intelligence gathering."
          },
          {
            id: "deal-thesis-document",
            number: 3,
            title: "The Deal Thesis Document",
            description: "The most critical document created before any contact is made. This lesson provides a template for a formal, written 'Deal Thesis' that clearly articulates why a specific target is the right choice and how the combined entity will be more valuable, forcing intellectual honesty before emotional commitment."
          }
        ]
      },
      {
        id: "valuation-price-value",
        number: 3,
        title: "Valuation: The Intersection of Price and Value",
        description: "Understanding how to value acquisition targets and determine appropriate pricing.",
        lessons: [
          {
            id: "intrinsic-vs-strategic-value",
            number: 1,
            title: "Intrinsic Value vs. Strategic Value",
            description: "A critical distinction for a CEO. This lesson explains how to establish a 'no-synergies' intrinsic value for the target as a baseline, and then separately quantify the 'strategic value'—the specific worth of the asset to you."
          },
          {
            id: "science-art-valuing-synergies",
            number: 2,
            title: "The Science and Art of Valuing Synergies",
            description: "A rigorous guide to valuing both cost synergies (often overestimated) and revenue synergies (almost always wildly overestimated). This provides a framework for creating defensible, risk-adjusted synergy estimates."
          },
          {
            id: "walk-away-price",
            number: 3,
            title: "Establishing the 'Walk-Away' Price",
            description: "A lesson in discipline. Based on the intrinsic and strategic value calculations, this module provides a framework for setting a hard, data-driven maximum price before the emotions of a negotiation take hold."
          }
        ]
      },
      {
        id: "deal-structuring-financing",
        number: 4,
        title: "Deal Structuring & Financing",
        description: "Understanding the mechanics of how deals are structured and financed.",
        lessons: [
          {
            id: "cash-stock-hybrid-deals",
            number: 1,
            title: "Cash vs. Stock vs. Hybrid Deals",
            description: "An analysis of the strategic implications of each currency. This lesson covers the signals they send to the market, their impact on shareholder dilution, and their effect on risk allocation between buyer and seller."
          },
          {
            id: "art-term-sheet",
            number: 2,
            title: "The Art of the Term Sheet: Key Non-Price Terms",
            description: "Price is only one part of the deal. This lesson focuses on the critical, non-price terms a CEO must understand, such as deal protection mechanisms (break-up fees), employee retention pools, and conditions to closing."
          },
          {
            id: "financing-deal-ceo-role",
            number: 3,
            title: "Financing the Deal: The CEO's Role with Bankers and the Board",
            description: "A high-level guide to the process of raising the capital required for a large transaction, whether through debt markets, equity issuance, or cash on hand."
          }
        ]
      },
      {
        id: "negotiation-playbook",
        number: 5,
        title: "The Negotiation Playbook",
        description: "Mastering the art of deal negotiation and stakeholder management.",
        lessons: [
          {
            id: "leading-deal-team",
            number: 1,
            title: "Leading the Deal Team",
            description: "The CEO doesn't lead every negotiation session, but they lead the team. This lesson provides a framework for assembling and managing the deal team (bankers, lawyers, internal experts) and defining clear roles and communication protocols."
          },
          {
            id: "psychology-other-side",
            number: 2,
            title: "The Psychology of the Other Side: Understanding Seller Motivations",
            description: "A crucial lesson in empathy and game theory. Is the seller motivated by price, legacy, employee welfare, or something else? Understanding their primary driver is the key to unlocking a successful deal."
          },
          {
            id: "managing-narrative-public",
            number: 3,
            title: "Managing the Narrative: Public Leaks and Stakeholder Communication",
            description: "A guide to managing the deal process in the public eye. This covers how to handle leaks, communicate with employees to prevent anxiety, and frame the deal's logic to investors and the press."
          }
        ]
      },
      {
        id: "due-diligence-hidden-risks",
        number: 6,
        title: "Due Diligence: Uncovering the Hidden Risks",
        description: "Conducting thorough due diligence to identify potential deal-breakers.",
        lessons: [
          {
            id: "due-diligence-beyond-financials",
            number: 1,
            title: "Due Diligence Beyond the Financials",
            description: "Financial and legal diligence are table stakes. This lesson focuses on the areas where deals most often fail: assessing cultural compatibility, identifying hidden technical debt in a software company, and securing the 'key person' risks associated with top talent."
          },
          {
            id: "clean-team-antitrust",
            number: 2,
            title: "The 'Clean Team' and Antitrust Risk Assessment",
            description: "A guide to the process of conducting deep diligence on a direct competitor without violating antitrust laws, using firewalled 'clean teams'."
          },
          {
            id: "red-flag-review",
            number: 3,
            title: "The Red Flag Review: Synthesizing Diligence into a Go/No-Go Decision",
            description: "The playbook for the final, critical meeting where all diligence findings are presented. This lesson provides a framework for making the ultimate Go/No-Go decision based on the synthesized findings."
          }
        ]
      },
      {
        id: "gauntlet-board-regulatory",
        number: 7,
        title: "The Gauntlet: Board & Regulatory Approval",
        description: "Navigating the approval process with boards and regulatory authorities.",
        lessons: [
          {
            id: "getting-yes-board",
            number: 1,
            title: "Getting to 'Yes': Managing the Board of Directors",
            description: "A guide to the internal political process of getting a major transaction approved by the board, including how to build consensus and address key director concerns."
          },
          {
            id: "navigating-global-antitrust",
            number: 2,
            title: "Navigating the Global Antitrust Maze (CFIUS, EU, China)",
            description: "For a multinational CEO, this is often the highest hurdle. This lesson provides a strategic overview of the major global regulatory bodies and the arguments required to secure their approval."
          }
        ]
      },
      {
        id: "post-merger-integration",
        number: 8,
        title: "Post-Merger Integration: The Engine of Value Creation",
        description: "Executing successful integration to realize the deal's value creation potential.",
        lessons: [
          {
            id: "first-100-days",
            number: 1,
            title: "The First 100 Days: The Integration Management Office (IMO) Playbook",
            description: "The definitive guide to launching the integration. This covers establishing a dedicated IMO, setting clear priorities, and securing early wins to build momentum."
          },
          {
            id: "winning-hearts-minds",
            number: 2,
            title: "Winning Hearts and Minds: The Cultural Integration Plan",
            description: "Culture is the leading cause of integration failure. This lesson provides a framework for diagnosing the cultural differences between the two companies and developing a proactive plan to merge them."
          },
          {
            id: "brutal-mechanics",
            number: 3,
            title: "The Brutal Mechanics: Systems, Process, and Synergies",
            description: "The tactical guide to the hard work of combining IT systems, financial reporting, HR policies, and actually capturing the cost synergies promised to investors."
          },
          {
            id: "retaining-key-talent",
            number: 4,
            title: "Retaining Key Talent: The Golden Handcuffs and Beyond",
            description: "A playbook for identifying and locking in the key employees from the acquired company who are critical to the deal's success."
          }
        ]
      },
      {
        id: "special-situations-advanced",
        number: 9,
        title: "Special Situations & Advanced Dealmaking",
        description: "Advanced dealmaking scenarios and alternative transaction structures.",
        lessons: [
          {
            id: "hostile-takeover-activist-defense",
            number: 1,
            title: "The Hostile Takeover and the Activist Defense",
            description: "The playbook for both sides of an unsolicited offer, providing the strategic tools for offense and defense."
          },
          {
            id: "joint-venture-partnership",
            number: 2,
            title: "The Joint Venture: A High-Potential, High-Failure Partnership",
            description: "A guide to structuring and managing strategic joint ventures as an alternative to a full acquisition."
          },
          {
            id: "strategic-divestiture",
            number: 3,
            title: "The Strategic Divestiture: Selling as a Form of Growth",
            description: "This lesson reframes selling a division not as a failure, but as a powerful strategic tool to sharpen focus and redeploy capital to more promising areas."
          }
        ]
      }
    ]
  },
  {
    id: "investor-market-narrative-control",
    title: "Investor & Market Narrative Control",
    philosophy: "The CEO of a public company has two jobs: 1) Run the business to create long-term intrinsic value, and 2) Persuade the market to recognize that value. These two jobs are inextricably linked. Narrative control is not about hype or short-term stock promotion; it is the art of educating investors, managing expectations, and building the deep, long-term credibility that underpins a premium valuation.",
    modules: [
      {
        id: "public-market-storytelling",
        number: 1,
        title: "The Public Market as a Storytelling Arena",
        description: "Understanding the dynamics and key players in public market communication.",
        lessons: [
          {
            id: "efficient-market-vs-mr-market",
            number: 1,
            title: "The Efficient Market Hypothesis vs. Mr. Market",
            description: "A foundational lesson on the two competing views of the market. We explore the academic theory of efficient markets and contrast it with Ben Graham's 'Mr. Market' allegory—the manic-depressive business partner whose daily price quotes are driven by emotion. The CEO's job is to ignore the daily mood swings while educating the rational, long-term investor."
          },
          {
            id: "players-on-field",
            number: 2,
            title: "The Players on the Field: Sell-Side, Buy-Side, and Activists",
            description: "A guide to the key actors in the market and their differing motivations. This lesson explains the roles of sell-side analysts (who write public research), the buy-side (the actual institutional investors who control the capital), and activist investors (who seek to force change)."
          },
          {
            id: "fiduciary-duty-regulation-fd",
            number: 3,
            title: "The CEO's Fiduciary Duty and Regulation FD",
            description: "An essential primer on the legal and ethical boundaries of market communication. This covers the CEO's duty to all shareholders and the rules of 'Fair Disclosure' (Reg FD), which prohibit selective disclosure of material information."
          }
        ]
      },
      {
        id: "architecting-core-narrative",
        number: 2,
        title: "Architecting the Core Narrative",
        description: "Building the foundational story that drives investor understanding and valuation.",
        lessons: [
          {
            id: "three-pillars-narrative",
            number: 1,
            title: "The Three Pillars of a Defensible Narrative: The TAM, The Moat, and The Execution",
            description: "This lesson provides the core framework for any strong investor narrative. It must tell a compelling story about: 1) The size and growth of the Total Addressable Market (The TAM), 2) The company's durable competitive advantage (The Moat), and 3) The management team's proven ability to execute its strategy."
          },
          {
            id: "north-star-metric",
            number: 2,
            title: "Crafting Your 'North Star' Metric",
            description: "Every great narrative is anchored by one or two key metrics that serve as a proxy for long-term value creation (e.g., Amazon's 'Free Cash Flow per Share,' Netflix's 'Subscriber Growth'). This lesson provides a guide to identifying and consistently communicating the metrics that best reflect the company's strategic goals."
          },
          {
            id: "shareholder-letter-cornerstone",
            number: 3,
            title: "The Shareholder Letter as a Narrative Cornerstone",
            description: "A deconstruction of the great shareholder letters (Buffett, Bezos, Dimon). This lesson treats the annual letter not as a backward-looking report, but as the single most important document for articulating the company's long-term philosophy, strategy, and narrative in the CEO's own voice."
          }
        ]
      },
      {
        id: "earnings-call-quarterly",
        number: 3,
        title: "The Earnings Call: The Quarterly Super Bowl",
        description: "Mastering the quarterly earnings communication process.",
        lessons: [
          {
            id: "anatomy-earnings-release",
            number: 1,
            title: "The Anatomy of an Earnings Release and Call",
            description: "A tactical, step-by-step guide to the quarterly earnings process, from drafting the press release and script to preparing for the Q&A session."
          },
          {
            id: "art-giving-guidance",
            number: 2,
            title: "The Art of Giving Guidance: Under-Promising and Over-Delivering",
            description: "An analysis of the high-stakes game of managing market expectations. This lesson covers the pros and cons of giving formal financial guidance and the importance of building a long-term track record of credibility by meeting or exceeding expectations."
          },
          {
            id: "bridging-numbers",
            number: 3,
            title: "'Bridging' the Numbers: Explaining the 'Why' Behind the Results",
            description: "A crucial communication skill. This lesson teaches a CEO how to 'bridge' the reported financial results to the underlying operational drivers, connecting the numbers in the financial statements to the strategic narrative of the business."
          },
          {
            id: "navigating-analyst-qa",
            number: 4,
            title: "Navigating the Analyst Q&A: The Art of the Non-Answer",
            description: "A playbook for handling the intense Q&A session. This covers techniques for answering tough questions, bridging back to key messages, and avoiding common traps without misleading investors."
          }
        ]
      },
      {
        id: "investor-day-roadshow",
        number: 4,
        title: "The Investor Day & The Roadshow",
        description: "Leveraging major investor events to reinforce and reset the company narrative.",
        lessons: [
          {
            id: "investor-day-re-underwriting",
            number: 1,
            title: "The Investor Day as a 'Re-Underwriting' Event",
            description: "The Investor Day is the CEO's opportunity to conduct a deep-dive, multi-hour presentation to reset and reinforce the company's long-term narrative, especially after a major strategic shift. This lesson provides a guide to structuring a compelling Investor Day agenda."
          },
          {
            id: "non-deal-roadshow",
            number: 2,
            title: "The Non-Deal Roadshow: Building a Coalition of Long-Term Holders",
            description: "An explanation of the proactive, ongoing process of meeting with key institutional investors. The goal of the non-deal roadshow is not to sell stock, but to build relationships and ensure the company's most important shareholders understand and support the long-term strategy."
          }
        ]
      },
      {
        id: "managing-sell-side-analysts",
        number: 5,
        title: "Managing the Sell-Side Analysts",
        description: "Building productive relationships with the analysts who cover your company.",
        lessons: [
          {
            id: "analyst-model-ratings",
            number: 1,
            title: "The Analyst's Model: Understanding What Drives Their Ratings",
            description: "This lesson provides a look inside the mind of a sell-side analyst. It explains how they build their financial models and what key assumptions drive their 'Buy,' 'Hold,' or 'Sell' ratings. The CEO's job is to influence these assumptions with credible data and a clear narrative."
          },
          {
            id: "care-feeding-sell-side",
            number: 2,
            title: "The Care and Feeding of the Sell-Side",
            description: "A guide to building constructive relationships with the analysts who cover the company, providing them with the access and information they need to do their jobs without violating Reg FD."
          }
        ]
      },
      {
        id: "activist-playbook-narrative-warfare",
        number: 6,
        title: "The Activist Playbook: Narrative Warfare",
        description: "Understanding and defending against activist investor campaigns.",
        lessons: [
          {
            id: "recognizing-signs-activists",
            number: 1,
            title: "Recognizing the Signs: How Activists Choose Their Targets",
            description: "This lesson outlines the key vulnerabilities that attract activist investors: a lagging stock price, a bloated cost structure, a non-core division, or a weak board."
          },
          {
            id: "activist-attack-vector",
            number: 2,
            title: "The Activist's Attack Vector: The 'White Paper' and the Proxy Fight",
            description: "A deconstruction of the activist's primary weapon—a public 'white paper' that presents an alternative, and often highly critical, narrative about the company. This lesson covers the strategic chess match of a public proxy fight."
          },
          {
            id: "ceo-defense-engagement",
            number: 3,
            title: "The CEO's Defense: Proactive Engagement and the 'Fight Letter'",
            description: "The playbook for defending against an activist campaign. This includes the importance of having a pre-existing relationship with major shareholders and the tactics of responding to an activist's claims with a clear, data-driven counter-narrative."
          }
        ]
      },
      {
        id: "crisis-management-narrative",
        number: 7,
        title: "Crisis Management & The Narrative",
        description: "Managing company narrative during crisis situations.",
        lessons: [
          {
            id: "apology-action-assurance",
            number: 1,
            title: "The 'Apology, Action, Assurance' Framework",
            description: "When a crisis hits (a product recall, a data breach), the market is judging the CEO's character as much as the financial impact. This lesson provides a communications framework for taking control of the narrative in the first 24 hours."
          },
          {
            id: "short-seller-report",
            number: 2,
            title: "The Short-Seller Report: A Special Kind of Crisis",
            description: "A guide to responding to a public short-seller report, which is a direct, often aggressive, attack on the company's narrative and integrity."
          }
        ]
      },
      {
        id: "ceo-personal-brand",
        number: 8,
        title: "The CEO's Personal Brand as a Narrative Asset",
        description: "Leveraging the CEO's personal reputation to enhance company narrative.",
        lessons: [
          {
            id: "ceo-chief-evangelist",
            number: 1,
            title: "The CEO as Chief Evangelist: Using Media to Amplify the Narrative",
            description: "An analysis of how visionary CEOs (like Steve Jobs or Elon Musk) use high-profile media appearances and product launches not just to sell products, but to reinforce the company's core narrative and build a 'reality distortion field'."
          },
          {
            id: "building-reputation-credibility",
            number: 2,
            title: "Building a Reputation for Credibility and Candor",
            description: "This capstone lesson emphasizes that the most valuable asset a CEO has in the public markets is their personal credibility. The market will forgive a bad quarter, but it will not forgive a CEO who loses their trust. This lesson analyzes how credibility is built over years, through consistency, transparency, and a track record of doing what you say you will do."
          }
        ]
      }
    ]
  }
]
