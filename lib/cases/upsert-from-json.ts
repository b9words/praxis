/**
 * Upsert helper to import JSON cases into database
 * Ensures JSON-backed cases (like cs_unit_economics_crisis) have DB records
 * so they can have simulations and work uniformly with the rest of the system
 */

import { loadInteractiveSimulation, type InteractiveSimulation } from '@/lib/case-study-loader'
import { getCaseById, createCase, updateCaseWithCompetencies } from '@/lib/db/cases'
import { prisma } from '@/lib/prisma/server'

/**
 * Resolve competency IDs from competency names
 * Uses multiple matching strategies and never fails - returns empty array if no matches
 */
async function resolveCompetencyIds(competencyNames: string[]): Promise<string[]> {
  if (!competencyNames || competencyNames.length === 0) {
    return []
  }

  const competencyIds: string[] = []
  const found = new Set<string>() // Avoid duplicates
  
  for (const name of competencyNames) {
    if (!name || typeof name !== 'string') continue
    
    // Strategy 1: Exact match (case-insensitive)
    let competency = await prisma.competency.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })
    
    // Strategy 2: Contains match (case-insensitive)
    if (!competency) {
      competency = await prisma.competency.findFirst({
        where: {
          name: {
            contains: name.trim(),
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    }
    
    // Strategy 3: Partial match - check if name contains competency name or vice versa
    if (!competency) {
      const allCompetencies = await prisma.competency.findMany({
        select: { id: true, name: true },
      })
      
      const normalizedSearch = name.trim().toLowerCase()
      for (const comp of allCompetencies) {
        const normalizedComp = comp.name.toLowerCase()
        if (normalizedSearch.includes(normalizedComp) || normalizedComp.includes(normalizedSearch)) {
          competency = { id: comp.id }
          break
        }
      }
    }
    
    if (competency && !found.has(competency.id)) {
      competencyIds.push(competency.id)
      found.add(competency.id)
    } else if (!competency) {
      // Log but don't fail - this is non-blocking
      console.warn(`[upsert-from-json] Competency not found: "${name}" - case will be saved without this competency`)
    }
  }
  
  return competencyIds
}

/**
 * Upsert a case from JSON file into database
 * @param caseId - The case ID (slug) from the JSON file
 * @param userId - User ID for createdBy/updatedBy (optional)
 * @returns The database case ID (UUID)
 */
export async function upsertCaseFromJson(
  caseId: string,
  userId?: string
): Promise<string> {
  // Load the JSON case
  const jsonCase = loadInteractiveSimulation(caseId)
  if (!jsonCase) {
    throw new Error(`Case ${caseId} not found in JSON files`)
  }

  // Check if case already exists in DB by metadata.caseId
  let existingCase = null
  try {
    // Try to find by metadata.caseId
    const allCases = await prisma.case.findMany({
      where: {
        published: true,
      },
      select: { id: true, metadata: true },
      take: 1000, // Reasonable limit
    })
    
    for (const c of allCases) {
      const meta = c.metadata as any
      if (meta?.caseId === caseId) {
        existingCase = await getCaseById(c.id)
        break
      }
    }
  } catch (error) {
    console.warn('[upsert-from-json] Error checking for existing case:', error)
    // Continue to create new case
  }

  // Resolve competencies
  const competencyIds = await resolveCompetencyIds(jsonCase.competencies || [])

  // Build briefing doc from description and stages
  const briefingDoc = `# ${jsonCase.title}\n\n${jsonCase.description}\n\n## Case Overview\n\nThis interactive simulation challenges you to make strategic decisions based on the provided information and data.\n\n**Estimated Duration:** ${jsonCase.estimatedDuration} minutes\n**Difficulty:** ${jsonCase.difficulty}\n**Competencies:** ${jsonCase.competencies?.join(', ') || 'N/A'}`

  // Create a basic rubric if not present
  const rubric = jsonCase.stages?.reduce((acc: any, stage: any) => {
    if (stage.challengeData?.rubric) {
      Object.assign(acc, stage.challengeData.rubric)
    }
    return acc
  }, {}) || {
    strategic_thinking: { weight: 0.25, description: 'Strategic approach and decision-making' },
    execution: { weight: 0.25, description: 'Execution and implementation' },
    analysis: { weight: 0.25, description: 'Data analysis and interpretation' },
    communication: { weight: 0.25, description: 'Communication and stakeholder management' },
  }

  const caseData = {
    title: jsonCase.title,
    description: jsonCase.description,
    briefingDoc,
    datasets: null,
    rubric,
    status: 'published' as const,
    published: true,
    difficulty: jsonCase.difficulty || 'intermediate',
    estimatedMinutes: jsonCase.estimatedDuration || 60,
    prerequisites: [],
    storagePath: null,
    metadata: {
      caseId: jsonCase.caseId,
      version: jsonCase.version,
      source: 'json',
    },
    competencyIds,
    createdBy: userId || null,
    updatedBy: userId || null,
  }

  if (existingCase) {
    // Update existing case
    const { createdBy, updatedBy, ...updateFields } = caseData
    const updated = await updateCaseWithCompetencies(existingCase.id, {
      ...updateFields,
      ...(userId && { updatedBy: userId }),
    })
    return updated.id
  } else {
    // Create new case
    const created = await createCase(caseData)
    return created.id
  }
}

