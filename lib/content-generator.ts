import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { TokenTracker } from './token-tracker'

export interface LessonStructure {
  moduleNumber: number
  moduleName: string
  lessonNumber: number
  lessonName: string
  description: string
}

export interface GeneratedLesson {
  title: string
  content: string
  competencyId: string
  status: 'draft' | 'in_review' | 'approved' | 'published'
  metadata: {
    moduleNumber: number
    lessonNumber: number
    estimatedReadingTime: number
    keyTakeaways: string[]
    visualizations: string[]
  }
}

export interface GenerationOptions {
  provider: 'openai' | 'gemini'
  model: string
  includeVisualizations: boolean
  includeMermaidDiagrams: boolean
  targetWordCount: number
  tone: 'professional' | 'academic' | 'conversational'
}

export class ContentGenerator {
  private openai?: OpenAI
  private gemini?: GoogleGenerativeAI
  private tokenTracker: TokenTracker

  constructor(openaiKey?: string, geminiKey?: string) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey })
    }
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey)
    }
    this.tokenTracker = new TokenTracker()
  }

  // Capital Allocation curriculum structure from lessons/1.md
  private capitalAllocationCurriculum: LessonStructure[] = [
    // Module 1: The CEO as an Investor
    { moduleNumber: 1, moduleName: "The CEO as an Investor: The Foundational Mindset", lessonNumber: 1, lessonName: "The Five Choices", description: "A rigorous introduction to the only five things a company can do with its capital: 1) Reinvest in the core business (organic growth), 2) Acquire other businesses (inorganic growth), 3) Pay down debt, 4) Issue dividends, and 5) Buy back stock." },
    { moduleNumber: 1, moduleName: "The CEO as an Investor: The Foundational Mindset", lessonNumber: 2, lessonName: "The Primacy of Per-Share Value", description: "A critical lesson on why gross revenue, profit, or market share are vanity metrics. The only long-term measure that matters is the intrinsic value per share." },
    { moduleNumber: 1, moduleName: "The CEO as an Investor: The Foundational Mindset", lessonNumber: 3, lessonName: "Opportunity Cost as a Guiding Principle", description: "This lesson drills down on the concept that every capital allocation decision must be benchmarked against all other available options, including the simplest one: buying back your own stock." },

    // Module 2: Calculating Intrinsic Value
    { moduleNumber: 2, moduleName: "Calculating Intrinsic Value: The Yardstick for Decision-Making", lessonNumber: 1, lessonName: "The Owner's Earnings Framework", description: "Moving beyond GAAP net income to calculate a company's true, cash-generating power. This lesson focuses on Warren Buffett's concept of 'Owner Earnings'." },
    { moduleNumber: 2, moduleName: "Calculating Intrinsic Value: The Yardstick for Decision-Making", lessonNumber: 2, lessonName: "Discounted Cash Flow (DCF) for the CEO", description: "A practical guide to DCF analysis not as a precise tool, but as a framework for understanding the key levers of value: cash flow growth, long-term profitability, and risk." },
    { moduleNumber: 2, moduleName: "Calculating Intrinsic Value: The Yardstick for Decision-Making", lessonNumber: 3, lessonName: "Sanity Checking Value with Multiples", description: "How to use public market comparables (EV/EBITDA, P/E) and precedent transaction analysis not as a primary valuation tool, but as a crucial cross-check." },

    // Module 3: Organic Reinvestment
    { moduleNumber: 3, moduleName: "Organic Reinvestment: Analyzing the Core Business", lessonNumber: 1, lessonName: "The Return on Invested Capital (ROIC) Framework", description: "ROIC is the single most important metric for measuring the quality of a business and the effectiveness of its management." },
    { moduleNumber: 3, moduleName: "Organic Reinvestment: Analyzing the Core Business", lessonNumber: 2, lessonName: "The Growth vs. ROIC Matrix", description: "A framework for making reinvestment decisions. This module explains why reinvesting in a high-ROIC business is the most powerful way to create value." },
    { moduleNumber: 3, moduleName: "Organic Reinvestment: Analyzing the Core Business", lessonNumber: 3, lessonName: "Maintenance CapEx vs. Growth CapEx", description: "A critical distinction for understanding a company's true reinvestment needs. This lesson explains how to separate the capital required to simply maintain the business from the capital being deployed to grow it." },

    // Module 4: Acquisitions
    { moduleNumber: 4, moduleName: "Acquisitions: The High-Stakes Path to Growth", lessonNumber: 1, lessonName: "The Build vs. Buy Decision Framework", description: "A structured guide for when to pursue an acquisition. This lesson covers the key strategic rationales: acquiring technology, entering a new market, consolidating an industry, or buying a high-ROIC business." },
    { moduleNumber: 4, moduleName: "Acquisitions: The High-Stakes Path to Growth", lessonNumber: 2, lessonName: "The Arithmetic of an Accretive Deal", description: "A non-technical explanation of accretion/dilution analysis. This lesson teaches a CEO how to quickly assess whether a deal is likely to increase or decrease earnings per share." },
    { moduleNumber: 4, moduleName: "Acquisitions: The High-Stakes Path to Growth", lessonNumber: 3, lessonName: "The Winner's Curse and Bidding Discipline", description: "An analysis of the behavioral biases that lead CEOs to overpay for acquisitions. This lesson focuses on the importance of setting a firm walk-away price based on intrinsic value." },

    // Module 5: Debt Management
    { moduleNumber: 5, moduleName: "Debt Management: A Tool for Value, Not a Source of Fear", lessonNumber: 1, lessonName: "The Role of Leverage in the Capital Structure", description: "This lesson explains how debt can be used strategically to magnify returns on equity (the concept of leverage). It introduces the framework of an optimal capital structure." },
    { moduleNumber: 5, moduleName: "Debt Management: A Tool for Value, Not a Source of Fear", lessonNumber: 2, lessonName: "Covenants, Credit Ratings, and Financial Flexibility", description: "A practical guide to the constraints that come with debt. This lesson explains how debt covenants and a company's credit rating impact its operational and strategic freedom." },

    // Module 6: Share Buybacks
    { moduleNumber: 6, moduleName: "Share Buybacks: The Most Misunderstood Tool", lessonNumber: 1, lessonName: "The Mathematics of a Share Repurchase", description: "A clear explanation of why buybacks increase per-share value. This lesson shows that a buyback is functionally equivalent to the company reinvesting in itself at the current market price." },
    { moduleNumber: 6, moduleName: "Share Buybacks: The Most Misunderstood Tool", lessonNumber: 2, lessonName: "The Price-Value Discipline", description: "The central lesson on buybacks: they are only intelligent when the company's stock is trading below its calculated intrinsic value." },
    { moduleNumber: 6, moduleName: "Share Buybacks: The Most Misunderstood Tool", lessonNumber: 3, lessonName: "Signaling and Market Perception", description: "An analysis of the non-financial aspects of buybacks. This lesson covers how buybacks are perceived by the market, their use as a signaling mechanism." },

    // Module 7: Dividends
    { moduleNumber: 7, moduleName: "Dividends: The Commitment to Return Capital", lessonNumber: 1, lessonName: "Dividends as a Signal of Stability and Discipline", description: "This lesson explains the role of a dividend policy in attracting a certain class of investor and imposing a sense of capital discipline on management." },
    { moduleNumber: 7, moduleName: "Dividends: The Commitment to Return Capital", lessonNumber: 2, lessonName: "The Dividend vs. Buyback Decision Framework", description: "A direct comparison of the two primary methods of returning capital to shareholders. This lesson covers the key differences in flexibility and tax efficiency." },

    // Module 8: The Capital Allocation Plan
    { moduleNumber: 8, moduleName: "The Capital Allocation Plan: A Formal Document", lessonNumber: 1, lessonName: "Codifying Your Philosophy", description: "This lesson guides the user in creating a formal, written Capital Allocation Plan. This document serves as a constitution for decision-making." },
    { moduleNumber: 8, moduleName: "The Capital Allocation Plan: A Formal Document", lessonNumber: 2, lessonName: "Communicating the Plan in the Annual Report", description: "An analysis of how great capital allocators (like Buffett) use their annual shareholder letter to educate their investors about their long-term approach to capital deployment." },

    // Module 9: Measuring Performance
    { moduleNumber: 9, moduleName: "Measuring Performance: Scorecards for the CEO", lessonNumber: 1, lessonName: "The Three- and Five-Year Test", description: "This lesson explains that the success of a capital allocation decision (especially an acquisition) cannot be judged in a single quarter." },
    { moduleNumber: 9, moduleName: "Measuring Performance: Scorecards for the CEO", lessonNumber: 2, lessonName: "Benchmarking Against the Index", description: "A hard-nosed look at performance. This lesson argues that if a CEO cannot generate a higher per-share value growth than a simple S&P 500 index fund over a five-year period, the shareholders would have been better off." },

    // Module 10: Advanced Topics
    { moduleNumber: 10, moduleName: "Advanced Topics: Spinoffs, Divestitures, and Restructuring", lessonNumber: 1, lessonName: "Spinoffs as a Tool to Unlock Value", description: "This lesson covers the strategic rationale for spinning off a business unit into a separate, publicly-traded company to eliminate a 'conglomerate discount'." },
    { moduleNumber: 10, moduleName: "Advanced Topics: Spinoffs, Divestitures, and Restructuring", lessonNumber: 2, lessonName: "The Art of the Divestiture", description: "A guide to selling non-core assets. This lesson explains how selling a business unit can be a powerful act of capital allocation." },

    // Module 11: Psychology of Capital Allocation
    { moduleNumber: 11, moduleName: "The Psychology of Capital Allocation: Overcoming Bias", lessonNumber: 1, lessonName: "The 'Action Imperative': Overcoming the Bias for Empire-Building", description: "An analysis of the institutional pressures and personal biases that lead CEOs to favor value-destroying acquisitions over 'boring' but value-creating buybacks." },
    { moduleNumber: 11, moduleName: "The Psychology of Capital Allocation: Overcoming Bias", lessonNumber: 2, lessonName: "Anchoring, Confirmation Bias, and the CEO", description: "A look at how common cognitive biases can distort major investment decisions, and the systems (like pre-mortems and formal checklists) that can be used to counteract them." },

    // Module 12: Integrated Case Study
    { moduleNumber: 12, moduleName: "The Integrated Case Study: A CEO's First Five Years", lessonNumber: 1, lessonName: "Year 1 - The Inheritance", description: "Analyzing the capital structure and investment opportunities of a newly inherited company." },
    { moduleNumber: 12, moduleName: "The Integrated Case Study: A CEO's First Five Years", lessonNumber: 2, lessonName: "Year 3 - The Crossroads", description: "Facing a major decision between a large acquisition, a massive buyback, and a special dividend." },
    { moduleNumber: 12, moduleName: "The Integrated Case Study: A CEO's First Five Years", lessonNumber: 3, lessonName: "Year 5 - The Reckoning", description: "Evaluating the results of the decisions made over the five-year period and setting the capital allocation strategy for the next five." }
  ]

  getCurriculum(): LessonStructure[] {
    return this.capitalAllocationCurriculum
  }

  private buildPrompt(lesson: LessonStructure, options: GenerationOptions): string {
    const basePrompt = `
You are an expert business educator creating comprehensive curriculum content for executive education. 

Generate a detailed lesson on "${lesson.lessonName}" for Module ${lesson.moduleNumber}: "${lesson.moduleName}".

LESSON DESCRIPTION: ${lesson.description}

REQUIREMENTS:
- Target length: ${options.targetWordCount} words (approximately 2-3 A4 pages)
- Tone: ${options.tone}
- Include real company examples and case studies
- Include specific data, metrics, and calculations where relevant
- Structure using clear headings and subheadings
- Include actionable frameworks and tools

${options.includeVisualizations ? `
VISUALIZATION REQUIREMENTS:
- Include at least 2-3 tables with real data
- Add calculation examples with step-by-step breakdowns
- Include comparison matrices or decision frameworks
` : ''}

${options.includeMermaidDiagrams ? `
MERMAID DIAGRAM REQUIREMENTS:
- Include 1-2 Mermaid diagrams to illustrate key concepts
- Use flowcharts for decision processes
- Use graphs for data relationships
- Wrap Mermaid code in \`\`\`mermaid blocks
- Examples: decision trees, process flows, organizational charts, timelines
` : ''}

CONTENT STRUCTURE:
1. **Executive Summary** (150-200 words)
   - Key concept overview
   - Why this matters for CEOs
   - Main takeaways

2. **Core Principle** (400-600 words)
   - Fundamental concept explanation
   - Theoretical foundation
   - Industry context

3. **The Framework** (600-800 words)
   - Step-by-step methodology
   - Decision criteria
   - Implementation process
   - Include tables and calculations

4. **Real-World Examples** (500-700 words)
   - 2-3 detailed company case studies
   - Specific numbers and outcomes
   - Lessons learned

5. **Common Pitfalls** (300-400 words)
   - Typical mistakes
   - Warning signs
   - How to avoid them

6. **Application Exercise** (200-300 words)
   - Practical scenario
   - Questions for reflection
   - Next steps

7. **Key Takeaways** (100-150 words)
   - 5-7 bullet points
   - Actionable insights
   - Remember points

Use markdown formatting with proper headers, tables, lists, and emphasis. Make the content engaging, practical, and immediately applicable for senior executives.
`

    return basePrompt.trim()
  }

  async generateLesson(
    lesson: LessonStructure, 
    options: GenerationOptions,
    competencyId: string
  ): Promise<GeneratedLesson> {
    const prompt = this.buildPrompt(lesson, options)
    let content: string

    try {
      // Check token limits for OpenAI models
      if (options.provider === 'openai') {
        const estimatedTokens = this.tokenTracker.estimateTokens(prompt)
        const tokenCheck = await this.tokenTracker.checkTokenLimit(options.model, estimatedTokens)
        
        console.log(`🔍 Token Check: ${tokenCheck.message}`)
        
        if (!tokenCheck.canProceed) {
          throw new Error(`Token limit exceeded: ${tokenCheck.message}`)
        }
      }

      if (options.provider === 'openai' && this.openai) {
        content = await this.generateWithOpenAI(prompt, options.model)
      } else if (options.provider === 'gemini' && this.gemini) {
        content = await this.generateWithGemini(prompt, options.model)
      } else {
        throw new Error(`Provider ${options.provider} not configured or available`)
      }

      // Extract key takeaways from content
      const keyTakeaways = this.extractKeyTakeaways(content)
      
      // Identify visualizations in content
      const visualizations = this.identifyVisualizations(content)

      // Estimate reading time (average 200 words per minute)
      const wordCount = content.split(/\s+/).length
      const estimatedReadingTime = Math.ceil(wordCount / 200)

      return {
        title: `${lesson.moduleNumber}.${lesson.lessonNumber}: ${lesson.lessonName}`,
        content,
        competencyId,
        status: 'draft',
        metadata: {
          moduleNumber: lesson.moduleNumber,
          lessonNumber: lesson.lessonNumber,
          estimatedReadingTime,
          keyTakeaways,
          visualizations
        }
      }
    } catch (error) {
      console.error('Error generating lesson:', error)
      throw new Error(`Failed to generate lesson: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async generateWithOpenAI(prompt: string, model: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured')

    const response = await this.openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert business educator and content creator specializing in executive education and capital allocation strategy.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    // Track token usage
    if (response.usage) {
      const today = new Date().toISOString().split('T')[0]
      await this.tokenTracker.trackUsage({
        date: today,
        model: model,
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      })

      console.log(`📊 Token Usage: ${response.usage.total_tokens} tokens (${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion)`)
    }

    return response.choices[0]?.message?.content || ''
  }

  private async generateWithGemini(prompt: string, model: string): Promise<string> {
    if (!this.gemini) throw new Error('Gemini not configured')

    const genModel = this.gemini.getGenerativeModel({ model })
    const result = await genModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  }

  private extractKeyTakeaways(content: string): string[] {
    // Look for "Key Takeaways" section and extract bullet points
    const takeawaysMatch = content.match(/## Key Takeaways\s*\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/i)
    if (!takeawaysMatch) return []

    const takeawaysText = takeawaysMatch[1]
    const bullets = takeawaysText.match(/[-*]\s+(.+)/g) || []
    return bullets.map(bullet => bullet.replace(/[-*]\s+/, '').trim()).slice(0, 7)
  }

  private identifyVisualizations(content: string): string[] {
    const visualizations: string[] = []
    
    // Check for tables
    if (content.includes('|')) {
      visualizations.push('tables')
    }
    
    // Check for Mermaid diagrams
    if (content.includes('```mermaid')) {
      visualizations.push('mermaid-diagrams')
    }
    
    // Check for charts/graphs mentions
    if (content.match(/chart|graph|diagram|matrix/i)) {
      visualizations.push('charts')
    }

    return visualizations
  }

  async generateBatchLessons(
    lessons: LessonStructure[],
    options: GenerationOptions,
    competencyId: string,
    onProgress?: (completed: number, total: number, currentLesson: string) => void
  ): Promise<GeneratedLesson[]> {
    const results: GeneratedLesson[] = []
    
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i]
      
      if (onProgress) {
        onProgress(i, lessons.length, lesson.lessonName)
      }

      try {
        const generatedLesson = await this.generateLesson(lesson, options, competencyId)
        results.push(generatedLesson)
        
        // Add delay between requests to avoid rate limiting
        if (i < lessons.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Failed to generate lesson ${lesson.lessonName}:`, error)
        // Continue with other lessons even if one fails
      }
    }

    if (onProgress) {
      onProgress(lessons.length, lessons.length, 'Complete')
    }

    return results
  }
}

// Export default models for each provider
export const DEFAULT_MODELS = {
  openai: {
    // High-tier models (1M tokens/day limit)
    'gpt-4o': 'GPT-4o (1M tokens/day)',
    'o1': 'o1 (1M tokens/day)',
    'o3': 'o3 (1M tokens/day)',
    // Mini models (10M tokens/day limit)
    'gpt-4o-mini': 'GPT-4o Mini (10M tokens/day)',
    'o1-mini': 'o1-mini (10M tokens/day)',
    'o3-mini': 'o3-mini (10M tokens/day)',
  },
  gemini: {
    'gemini-1.5-pro-latest': 'Gemini 1.5 Pro (Latest)',
    'gemini-1.5-flash-latest': 'Gemini 1.5 Flash (Fast)',
    'gemini-pro': 'Gemini Pro',
  }
} as const

// Token limits for OpenAI models (daily)
export const OPENAI_TOKEN_LIMITS = {
  // High-tier models: 1M tokens/day
  'gpt-4o': 1000000,
  'o1': 1000000,
  'o3': 1000000,
  // Mini models: 10M tokens/day
  'gpt-4o-mini': 10000000,
  'o1-mini': 10000000,
  'o3-mini': 10000000,
} as const

export type OpenAIModel = keyof typeof DEFAULT_MODELS.openai
export type GeminiModel = keyof typeof DEFAULT_MODELS.gemini
