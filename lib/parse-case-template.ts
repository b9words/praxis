import { CaseStructure, Persona } from '@/types/simulation.types'

/**
 * Parses case briefing document following Content Ops template
 * Expected structure:
 * #### The Scenario
 * #### Your Role
 * #### Key Stakeholders
 * #### The Decision Point(s)
 */
export function parseCaseBriefing(markdown: string): CaseStructure | null {
  const sections: Record<string, string> = {}
  
  // Split by h4 headings
  const h4Pattern = /^#### (.+)$/gm
  const matches = Array.from(markdown.matchAll(h4Pattern))
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const heading = match[1].toLowerCase().trim()
    const startIndex = match.index! + match[0].length
    const endIndex = matches[i + 1]?.index || markdown.length
    const content = markdown.substring(startIndex, endIndex).trim()
    
    sections[heading] = content
  }

  // Extract stakeholders (parse as list)
  const stakeholders: Persona[] = []
  const stakeholdersText = sections['key stakeholders'] || sections['stakeholders'] || ''
  
  // Simple parsing: each stakeholder is a paragraph or list item
  const stakeholderBlocks = stakeholdersText.split(/\n\n+/)
  stakeholderBlocks.forEach((block, idx) => {
    if (block.trim()) {
      const lines = block.split('\n')
      const firstLine = lines[0].replace(/^[-*]\s*/, '').trim()
      
      // Try to extract name and role
      const nameRoleMatch = firstLine.match(/^(.+?)[:-]\s*(.+)$/)
      
      stakeholders.push({
        id: `persona-${idx}`,
        name: nameRoleMatch ? nameRoleMatch[1].trim() : `Stakeholder ${idx + 1}`,
        role: nameRoleMatch ? nameRoleMatch[2].trim() : firstLine,
        motivations: lines.slice(1).filter(l => l.includes('motivat')),
        biases: lines.slice(1).filter(l => l.includes('bias')),
        knowledge: {},
      })
    }
  })

  return {
    scenario: sections['the scenario'] || sections['scenario'] || '',
    yourRole: sections['your role'] || sections['role'] || '',
    keyStakeholders: stakeholders,
    decisionPoints: [], // These come from case.decision_points in DB
  }
}

/**
 * Validates if case briefing follows template
 */
export function validateCaseTemplate(markdown: string): {
  valid: boolean
  missingSections?: string[]
} {
  const requiredSections = ['the scenario', 'your role', 'key stakeholders', 'the decision point']
  const missingSections: string[] = []
  
  for (const section of requiredSections) {
    const pattern = new RegExp(`^####\\s+${section}`, 'im')
    if (!pattern.test(markdown)) {
      missingSections.push(section)
    }
  }
  
  return {
    valid: missingSections.length === 0,
    missingSections: missingSections.length > 0 ? missingSections : undefined,
  }
}

