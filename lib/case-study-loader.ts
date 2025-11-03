import * as fs from 'fs'
import matter from 'gray-matter'
import * as path from 'path'

export interface CaseStudy {
  id: string
  title: string
  company?: string
  industry?: string
  timeframe?: string
  difficulty?: string
  estimatedReadTime?: number
  description?: string
  content: string
  year?: string
}

export interface InteractiveSimulation {
  caseId: string
  version: string
  title: string
  description: string
  competencies: string[]
  estimatedDuration: number
  difficulty: string
  caseFiles: Array<{
    fileId: string
    fileName: string
    fileType: string
    source: {
      type: string
      content: string
    }
  }>
  stages: Array<{
    stageId: string
    stageTitle?: string
    title?: string
    description: string
    challengeType: string
    challengeLayout?: string
    challengeData: any
  }>
}

export function loadCaseStudy(caseId: string): CaseStudy | null {
  try {
    // Search in content/cases directory
    const casesDir = path.join(process.cwd(), 'content', 'cases')
    
    if (!fs.existsSync(casesDir)) {
      return null
    }

    // Recursively search for the case study file
    const findCaseFile = (dir: string, targetId: string): string | null => {
      const files = fs.readdirSync(dir)
      
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
          const found = findCaseFile(filePath, targetId)
          if (found) return found
        } else if (file === `${targetId}.md` || file.replace('.md', '') === targetId) {
          return filePath
        }
      }
      
      return null
    }

    const casePath = findCaseFile(casesDir, caseId)
    
    if (!casePath) {
      return null
    }

    const fileContents = fs.readFileSync(casePath, 'utf8')
    const { data, content } = matter(fileContents)

    // Extract year from path
    const pathParts = casePath.split(path.sep)
    const yearIndex = pathParts.indexOf('year1') !== -1 ? pathParts.indexOf('year1') :
                      pathParts.indexOf('year2') !== -1 ? pathParts.indexOf('year2') :
                      pathParts.indexOf('year3') !== -1 ? pathParts.indexOf('year3') :
                      pathParts.indexOf('year4') !== -1 ? pathParts.indexOf('year4') :
                      pathParts.indexOf('year5') !== -1 ? pathParts.indexOf('year5') : -1
    
    const year = yearIndex !== -1 ? pathParts[yearIndex] : undefined

    return {
      id: data.id || caseId,
      title: data.title || 'Untitled Case Study',
      company: data.company,
      industry: data.industry,
      timeframe: data.timeframe,
      difficulty: data.difficulty || 'intermediate',
      estimatedReadTime: data.estimatedReadTime || data.duration || 15,
      description: data.description,
      content,
      year
    }
  } catch (error) {
    console.error(`Error loading case study ${caseId}:`, error)
    return null
  }
}

/**
 * Load interactive simulation from JSON data
 */
export function loadInteractiveSimulation(caseId: string): InteractiveSimulation | null {
  try {
    const simulationsDir = path.join(process.cwd(), 'data', 'case-studies')
    const simulationPath = path.join(simulationsDir, `${caseId}.json`)
    
    if (!fs.existsSync(simulationPath)) {
      return null
    }
    
    const fileContents = fs.readFileSync(simulationPath, 'utf8')
    const simulation = JSON.parse(fileContents) as InteractiveSimulation
    
    return simulation
  } catch (error) {
    console.error(`Error loading interactive simulation ${caseId}:`, error)
    return null
  }
}

/**
 * Get all available interactive simulations
 */
export function getAllInteractiveSimulations(): InteractiveSimulation[] {
  try {
    const simulationsDir = path.join(process.cwd(), 'data', 'case-studies')
    
    if (!fs.existsSync(simulationsDir)) {
      return []
    }
    
    const simulations: InteractiveSimulation[] = []
    const files = fs.readdirSync(simulationsDir)
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(simulationsDir, file)
          const fileContents = fs.readFileSync(filePath, 'utf8')
          const simulation = JSON.parse(fileContents) as InteractiveSimulation
          simulations.push(simulation)
        } catch (error) {
          console.error(`Error reading simulation ${file}:`, error)
        }
      }
    }
    
    return simulations
  } catch (error) {
    console.error('Error getting interactive simulations:', error)
    return []
  }
}

/**
 * Get all case studies (both markdown and interactive simulations)
 */
export function getAllCaseStudies(): CaseStudy[] {
  try {
    const casesDir = path.join(process.cwd(), 'content', 'cases')
    
    if (!fs.existsSync(casesDir)) {
      return []
    }

    const caseStudies: CaseStudy[] = []

    const scanDirectory = (dir: string) => {
      const files = fs.readdirSync(dir)
      
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
          scanDirectory(filePath)
        } else if (file.endsWith('.md') && file !== 'README.md') {
          try {
            const fileContents = fs.readFileSync(filePath, 'utf8')
            const { data, content } = matter(fileContents)
            
            // Extract year from path
            const pathParts = filePath.split(path.sep)
            const yearIndex = pathParts.indexOf('year1') !== -1 ? pathParts.indexOf('year1') :
                              pathParts.indexOf('year2') !== -1 ? pathParts.indexOf('year2') :
                              pathParts.indexOf('year3') !== -1 ? pathParts.indexOf('year3') :
                              pathParts.indexOf('year4') !== -1 ? pathParts.indexOf('year4') :
                              pathParts.indexOf('year5') !== -1 ? pathParts.indexOf('year5') : -1
            const year = yearIndex !== -1 ? pathParts[yearIndex] : undefined
            
            // Generate ID from filename
            const id = file.replace('.md', '')

            caseStudies.push({
              id: data.id || id,
              title: data.title || file.replace('.md', '').replace(/-/g, ' '),
              company: data.company,
              industry: data.industry,
              timeframe: data.timeframe,
              difficulty: data.difficulty || 'intermediate',
              estimatedReadTime: data.estimatedReadTime || data.duration || 15,
              description: data.description || content.substring(0, 200) + '...',
              content,
              year
            })
          } catch (error) {
            console.error(`Error reading case study ${filePath}:`, error)
          }
        }
      }
    }

    scanDirectory(casesDir)
    
    return caseStudies
  } catch (error) {
    console.error('Error getting case studies:', error)
    return []
  }
}

/**
 * Get unified case studies and simulations for curriculum integration
 */
export function getAllLearningCases(): Array<CaseStudy | InteractiveSimulation> {
  const markdownCases = getAllCaseStudies()
  const interactiveSimulations = getAllInteractiveSimulations()
  
  // Convert interactive simulations to case study format for unified interface
  const simulationsAsCases: CaseStudy[] = interactiveSimulations.map(sim => ({
    id: sim.caseId,
    title: sim.title,
    description: sim.description,
    difficulty: sim.difficulty,
    estimatedReadTime: sim.estimatedDuration,
    content: `# ${sim.title}\n\n${sim.description}\n\n**Competencies:** ${sim.competencies.join(', ')}\n\n**Type:** Interactive Simulation`,
    company: extractCompanyFromTitle(sim.title),
    industry: sim.competencies[0] // Use first competency as industry proxy
  }))
  
  return [...markdownCases, ...simulationsAsCases]
}

/**
 * Extract company name from simulation title
 */
function extractCompanyFromTitle(title: string): string | undefined {
  // Look for patterns like "Company Name:" or "Company's Crisis"
  const companyMatch = title.match(/^([A-Z][a-zA-Z\s&]+?)(?:['s]|\s*:|\s*-)/);
  return companyMatch ? companyMatch[1].trim() : undefined;
}
