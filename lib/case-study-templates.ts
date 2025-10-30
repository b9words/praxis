// Case Study Templates and Helpers for Each Module

export interface CaseStudyData {
  id: string
  title: string
  company: string
  industry: string
  timeframe: string
  situation: string
  challenge: string
  actions: string[]
  results: {
    metric: string
    before: string
    after: string
    improvement: string
  }[]
  lessons: string[]
  keyTakeaways: string[]
  relatedConcepts: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedReadTime: number
}

// Template for creating new case studies
export const createCaseStudyTemplate = (
  moduleId: string,
  lessonId: string,
  overrides: Partial<CaseStudyData> = {}
): CaseStudyData => ({
  id: `${moduleId}-${lessonId}-case-study`,
  title: 'Case Study Title',
  company: 'Company Name',
  industry: 'Industry',
  timeframe: 'YYYY-YYYY',
  situation: `Describe the initial situation and context that led to the strategic decision.

Include:
- Market conditions
- Company position
- Key stakeholders
- Available resources`,
  challenge: `Outline the specific challenges and constraints faced.

Key challenges might include:
- **Challenge 1**: Description
- **Challenge 2**: Description
- **Challenge 3**: Description
- **Challenge 4**: Description`,
  actions: [
    'First major action taken by leadership',
    'Second strategic initiative implemented',
    'Third key decision or policy change',
    'Fourth implementation step',
    'Fifth monitoring or adjustment action'
  ],
  results: [
    {
      metric: 'Key Performance Indicator 1',
      before: 'Baseline value',
      after: 'Final value',
      improvement: 'Percentage or multiple improvement'
    },
    {
      metric: 'Key Performance Indicator 2',
      before: 'Baseline value',
      after: 'Final value',
      improvement: 'Percentage or multiple improvement'
    },
    {
      metric: 'Key Performance Indicator 3',
      before: 'Baseline value',
      after: 'Final value',
      improvement: 'Percentage or multiple improvement'
    }
  ],
  lessons: [
    '**Lesson 1**: Key insight learned from this experience',
    '**Lesson 2**: Important principle demonstrated',
    '**Lesson 3**: Critical success factor identified',
    '**Lesson 4**: Warning or pitfall to avoid'
  ],
  keyTakeaways: [
    'Actionable insight for executives',
    'Principle that can be applied broadly',
    'Framework or tool demonstrated',
    'Mindset or approach validated',
    'Process or system improvement',
    'Leadership behavior exemplified'
  ],
  relatedConcepts: [
    'Framework 1',
    'Framework 2',
    'Framework 3',
    'Framework 4'
  ],
  difficulty: 'intermediate',
  estimatedReadTime: 12,
  ...overrides
})

// Pre-built case studies for Capital Allocation domain
export const capitalAllocationCaseStudies = {
  'five-choices': createCaseStudyTemplate('ceo-as-investor', 'five-choices', {
    title: 'Microsoft\'s Transformation: From Software Licensing to Cloud Services',
    company: 'Microsoft Corporation',
    industry: 'Technology Software',
    timeframe: '2014-2024',
    difficulty: 'advanced',
    estimatedReadTime: 15
  }),
  
  'per-share-value': createCaseStudyTemplate('ceo-as-investor', 'per-share-value', {
    title: 'Amazon\'s Long-term Value Creation Strategy',
    company: 'Amazon.com Inc.',
    industry: 'E-commerce & Cloud Computing',
    timeframe: '1997-2023',
    difficulty: 'advanced',
    estimatedReadTime: 18
  }),
  
  'opportunity-cost': createCaseStudyTemplate('ceo-as-investor', 'opportunity-cost', {
    title: 'Berkshire Hathaway\'s Opportunity Cost Framework',
    company: 'Berkshire Hathaway Inc.',
    industry: 'Diversified Conglomerate',
    timeframe: '1990-2020',
    difficulty: 'advanced',
    estimatedReadTime: 16
  }),

  'owners-earnings': createCaseStudyTemplate('calculating-intrinsic-value', 'owners-earnings', {
    title: 'Coca-Cola\'s Owner Earnings Analysis',
    company: 'The Coca-Cola Company',
    industry: 'Beverages',
    timeframe: '2010-2020',
    difficulty: 'intermediate',
    estimatedReadTime: 12
  }),

  'dcf-for-ceo': createCaseStudyTemplate('calculating-intrinsic-value', 'dcf-for-ceo', {
    title: 'Tesla\'s Valuation Challenge: DCF in High-Growth Companies',
    company: 'Tesla Inc.',
    industry: 'Electric Vehicles',
    timeframe: '2018-2023',
    difficulty: 'advanced',
    estimatedReadTime: 14
  }),

  'roic-framework': createCaseStudyTemplate('organic-reinvestment', 'roic-framework', {
    title: 'Home Depot\'s ROIC-Driven Growth Strategy',
    company: 'The Home Depot Inc.',
    industry: 'Home Improvement Retail',
    timeframe: '2015-2022',
    difficulty: 'intermediate',
    estimatedReadTime: 13
  }),

  'build-vs-buy': createCaseStudyTemplate('acquisitions', 'build-vs-buy', {
    title: 'Google\'s Build vs Buy Decisions in AI',
    company: 'Alphabet Inc.',
    industry: 'Technology',
    timeframe: '2010-2023',
    difficulty: 'advanced',
    estimatedReadTime: 16
  }),

  'buyback-mathematics': createCaseStudyTemplate('share-buybacks', 'buyback-mathematics', {
    title: 'Apple\'s $600 Billion Buyback Program',
    company: 'Apple Inc.',
    industry: 'Technology',
    timeframe: '2012-2023',
    difficulty: 'intermediate',
    estimatedReadTime: 14
  })
}

// Helper function to get case study by lesson path
export const getCaseStudyByLesson = (
  domainId: string, 
  moduleId: string, 
  lessonId: string
): CaseStudyData | null => {
  // For now, return capital allocation case studies
  if (domainId === 'capital-allocation') {
    return capitalAllocationCaseStudies[lessonId as keyof typeof capitalAllocationCaseStudies] || null
  }
  
  // Return a generic template for other domains
  return createCaseStudyTemplate(moduleId, lessonId, {
    title: `Case Study: ${lessonId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    company: 'Fortune 500 Company',
    industry: 'Various Industries',
    timeframe: '2020-2024'
  })
}

// Case study categories for organization
export const caseStudyCategories = {
  'capital-allocation': 'Capital Allocation Excellence',
  'competitive-moats': 'Building Competitive Advantages',
  'systems-thinking': 'Complex Systems Navigation',
  'organizational-design': 'Organizational Excellence',
  'dealmaking': 'Strategic Transactions',
  'investor-relations': 'Market Communication',
  'geopolitical': 'Global Navigation',
  'crisis-leadership': 'Crisis Management',
  'decision-making': 'Strategic Decision Making',
  'technology-foresight': 'Future-Oriented Strategy'
}

// Difficulty level descriptions
export const difficultyLevels = {
  beginner: {
    description: 'Foundational concepts with clear frameworks',
    audience: 'New executives, functional leaders',
    complexity: 'Single-variable decisions with clear outcomes'
  },
  intermediate: {
    description: 'Multi-faceted scenarios requiring trade-off analysis',
    audience: 'Experienced managers, senior directors',
    complexity: 'Multiple stakeholders and competing priorities'
  },
  advanced: {
    description: 'Complex, ambiguous situations with high stakes',
    audience: 'Senior executives, board members',
    complexity: 'Systemic implications and long-term consequences'
  }
}
