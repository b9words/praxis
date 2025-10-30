/**
 * Simulation Content Converter
 * 
 * Utility to convert static markdown case studies to interactive JSON simulations
 * that leverage the powerful simulation engine blocks and layouts.
 */

export interface MarkdownCase {
  title: string
  content: string
  metadata: {
    competency?: string[]
    domain?: string
    year?: number
    difficulty?: string
    estimatedTime?: string
  }
}

export interface SimulationStage {
  stageId: string
  stageTitle: string
  description: string
  challengeType: 'STRATEGIC_OPTIONS' | 'WRITTEN_ANALYSIS' | 'FINANCIAL_MODELING' | 'BOARD_DECK_CRITIQUE' | 'NEGOTIATION' | 'EARNINGS_CALL_QA'
  challengeData: any
}

export interface CaseFile {
  fileId: string
  fileName: string
  fileType: 'FINANCIAL_DATA' | 'MEMO' | 'REPORT' | 'PRESENTATION_DECK'
  source: {
    type: 'STATIC'
    content: string
  }
}

export interface InteractiveSimulation {
  caseId: string
  version: string
  title: string
  description: string
  competencies: string[]
  estimatedDuration: number
  difficulty: string
  caseFiles: CaseFile[]
  stages: SimulationStage[]
}

/**
 * Convert markdown case study to interactive simulation
 */
export function convertMarkdownToSimulation(
  markdownCase: MarkdownCase,
  caseId: string
): InteractiveSimulation {
  const stages = extractStagesFromMarkdown(markdownCase.content)
  const caseFiles = extractDataFilesFromMarkdown(markdownCase.content)
  
  return {
    caseId,
    version: "1.0",
    title: markdownCase.title,
    description: extractDescription(markdownCase.content),
    competencies: markdownCase.metadata.competency || ["Strategic Thinking", "Decision Making"],
    estimatedDuration: parseEstimatedTime(markdownCase.metadata.estimatedTime || "60 minutes"),
    difficulty: markdownCase.metadata.difficulty || "intermediate",
    caseFiles,
    stages
  }
}

/**
 * Extract decision points from markdown and convert to interactive stages
 */
function extractStagesFromMarkdown(content: string): SimulationStage[] {
  const stages: SimulationStage[] = []
  
  // Look for "Decision Point" sections
  const decisionPointRegex = /### Decision Point (\d+): (.+?)\n\n\*\*Situation\*\*: (.+?)\n\n(.+?)(?=### Decision Point|\n## |$)/gs
  
  let match
  while ((match = decisionPointRegex.exec(content)) !== null) {
    const [, pointNumber, title, situation, optionsContent] = match
    
    const stage: SimulationStage = {
      stageId: `decision_point_${pointNumber}`,
      stageTitle: title.trim(),
      description: situation.trim(),
      challengeType: determineStageType(title, optionsContent),
      challengeData: extractChallengeData(title, situation, optionsContent)
    }
    
    stages.push(stage)
  }
  
  return stages
}

/**
 * Determine the appropriate challenge type based on content
 */
function determineStageType(title: string, content: string): SimulationStage['challengeType'] {
  const lowerTitle = title.toLowerCase()
  const lowerContent = content.toLowerCase()
  
  if (lowerTitle.includes('pricing') || lowerContent.includes('financial model')) {
    return 'FINANCIAL_MODELING'
  }
  
  if (lowerTitle.includes('communication') || lowerTitle.includes('presentation')) {
    return 'WRITTEN_ANALYSIS'
  }
  
  if (lowerTitle.includes('board') || lowerContent.includes('board deck')) {
    return 'BOARD_DECK_CRITIQUE'
  }
  
  if (lowerContent.includes('option a') && lowerContent.includes('option b')) {
    return 'STRATEGIC_OPTIONS'
  }
  
  return 'STRATEGIC_OPTIONS' // Default
}

/**
 * Extract challenge data based on stage type
 */
function extractChallengeData(title: string, situation: string, content: string): any {
  const stageType = determineStageType(title, content)
  
  switch (stageType) {
    case 'STRATEGIC_OPTIONS':
      return extractStrategicOptions(content)
    
    case 'WRITTEN_ANALYSIS':
      return extractWrittenAnalysis(title, situation, content)
    
    case 'FINANCIAL_MODELING':
      return extractFinancialModeling(content)
    
    case 'BOARD_DECK_CRITIQUE':
      return extractBoardDeckCritique(content)
    
    default:
      return { prompt: situation }
  }
}

/**
 * Extract strategic options from markdown content
 */
function extractStrategicOptions(content: string): any {
  const options: any[] = []
  
  // Look for Option A, Option B, etc.
  const optionRegex = /\*\*Option ([A-Z])\*\*: (.+?)\n- (.+?)(?=\*\*Option [A-Z]|\*\*Your Recommendation|\n\n|$)/gs
  
  let match
  while ((match = optionRegex.exec(content)) !== null) {
    const [, letter, title, description] = match
    
    options.push({
      id: `option_${letter.toLowerCase()}`,
      title: title.trim(),
      description: description.trim().replace(/\n- /g, ' ')
    })
  }
  
  return {
    prompt: "Analyze the situation and choose your strategic approach.",
    options
  }
}

/**
 * Extract written analysis requirements
 */
function extractWrittenAnalysis(title: string, situation: string, content: string): any {
  // Look for word limits, key points, etc.
  const wordLimitMatch = content.match(/(\d+)\s*words?/i)
  const wordLimit = wordLimitMatch ? parseInt(wordLimitMatch[1]) : 1000
  
  // Extract key points or requirements
  const keyPoints: string[] = []
  const requirementsRegex = /(?:Key Points|Requirements|Must Include):\s*\n((?:[-*]\s*.+\n?)+)/gi
  const requirementsMatch = requirementsRegex.exec(content)
  
  if (requirementsMatch) {
    const points = requirementsMatch[1].split('\n').filter(line => line.trim())
    keyPoints.push(...points.map(point => point.replace(/^[-*]\s*/, '').trim()))
  }
  
  return {
    prompt: situation,
    wordLimit,
    keyPoints: keyPoints.length > 0 ? keyPoints : [
      "Provide clear analysis with supporting data",
      "Present specific recommendations",
      "Address key risks and mitigation strategies"
    ]
  }
}

/**
 * Extract financial modeling requirements
 */
function extractFinancialModeling(content: string): any {
  return {
    prompt: "Build a financial model to analyze the scenarios and recommend the optimal approach.",
    modelingRequirements: {
      scenarios: 3,
      timeHorizon: "12 months",
      keyMetrics: ["Revenue Impact", "Cost Structure", "Cash Flow", "ROI Analysis"]
    }
  }
}

/**
 * Extract board deck critique requirements
 */
function extractBoardDeckCritique(content: string): any {
  return {
    prompt: "Review the proposal and provide executive feedback on the strategic approach.",
    critiqueAreas: [
      "Strategic rationale and assumptions",
      "Financial projections and feasibility", 
      "Risk assessment and mitigation",
      "Implementation timeline and resources",
      "Alternative approaches to consider"
    ]
  }
}

/**
 * Extract data files from markdown content
 */
function extractDataFilesFromMarkdown(content: string): CaseFile[] {
  const caseFiles: CaseFile[] = []
  
  // Look for data tables and file sections
  const fileRegex = /### File (\d+): (.+?)\n\n```\n([\s\S]+?)\n```/g
  
  let match
  while ((match = fileRegex.exec(content)) !== null) {
    const [, fileNumber, fileName, fileContent] = match
    
    const caseFile: CaseFile = {
      fileId: `data_file_${fileNumber}`,
      fileName: fileName.trim(),
      fileType: determineFileType(fileName, fileContent),
      source: {
        type: 'STATIC',
        content: fileContent.trim()
      }
    }
    
    caseFiles.push(caseFile)
  }
  
  return caseFiles
}

/**
 * Determine file type based on name and content
 */
function determineFileType(fileName: string, content: string): CaseFile['fileType'] {
  const lowerName = fileName.toLowerCase()
  
  if (lowerName.includes('memo') || lowerName.includes('email')) {
    return 'MEMO'
  }
  
  if (lowerName.includes('report') || lowerName.includes('analysis')) {
    return 'REPORT'
  }
  
  if (lowerName.includes('deck') || lowerName.includes('presentation')) {
    return 'PRESENTATION_DECK'
  }
  
  // Check if content looks like CSV/tabular data
  if (content.includes(',') && content.split('\n').length > 2) {
    return 'FINANCIAL_DATA'
  }
  
  return 'REPORT' // Default
}

/**
 * Extract case description from markdown
 */
function extractDescription(content: string): string {
  // Look for the first paragraph after "## Case Brief" or similar
  const briefMatch = content.match(/## Case Brief\s*\n\s*(.+?)(?=\n\n|\n###)/s)
  if (briefMatch) {
    return briefMatch[1].trim()
  }
  
  // Fallback: use first paragraph
  const firstParagraph = content.split('\n\n')[0]
  return firstParagraph.replace(/^#+\s*/, '').trim()
}

/**
 * Parse estimated time string to minutes
 */
function parseEstimatedTime(timeString: string): number {
  const match = timeString.match(/(\d+)(?:-(\d+))?\s*(?:minutes?|mins?|hours?|hrs?)/i)
  if (!match) return 60
  
  const [, min, max] = match
  const isHours = timeString.toLowerCase().includes('hour')
  
  let minutes = parseInt(min)
  if (max) {
    minutes = Math.round((parseInt(min) + parseInt(max)) / 2)
  }
  
  return isHours ? minutes * 60 : minutes
}

/**
 * Generate simulation templates for common case types
 */
export const simulationTemplates = {
  unitEconomics: {
    competencies: ["Financial Analysis", "Unit Economics", "Strategic Decision Making"],
    stages: ["immediate_action", "pricing_strategy", "cost_optimization", "strategic_recommendation"]
  },
  
  operationalCrisis: {
    competencies: ["Crisis Management", "Operations", "Leadership", "Stakeholder Communication"],
    stages: ["crisis_assessment", "immediate_response", "stakeholder_communication", "recovery_plan"]
  },
  
  strategicPositioning: {
    competencies: ["Strategic Thinking", "Competitive Analysis", "Market Positioning"],
    stages: ["market_analysis", "competitive_assessment", "positioning_strategy", "implementation_plan"]
  },
  
  fundraising: {
    competencies: ["Financial Planning", "Investor Relations", "Strategic Communication"],
    stages: ["funding_strategy", "investor_targeting", "pitch_preparation", "negotiation_tactics"]
  }
}

/**
 * Validate simulation structure
 */
export function validateSimulation(simulation: InteractiveSimulation): string[] {
  const errors: string[] = []
  
  if (!simulation.caseId || simulation.caseId.length < 3) {
    errors.push("Case ID must be at least 3 characters")
  }
  
  if (!simulation.title || simulation.title.length < 10) {
    errors.push("Title must be at least 10 characters")
  }
  
  if (!simulation.stages || simulation.stages.length === 0) {
    errors.push("Simulation must have at least one stage")
  }
  
  if (simulation.estimatedDuration < 15 || simulation.estimatedDuration > 300) {
    errors.push("Estimated duration should be between 15-300 minutes")
  }
  
  // Validate each stage
  simulation.stages.forEach((stage, index) => {
    if (!stage.stageId || !stage.stageTitle) {
      errors.push(`Stage ${index + 1} missing required fields`)
    }
    
    if (!stage.challengeData) {
      errors.push(`Stage ${index + 1} missing challenge data`)
    }
  })
  
  return errors
}
