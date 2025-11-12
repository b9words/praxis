/**
 * Case-specific caching utilities
 * Separated from cache.ts to avoid pulling case-study-loader into Edge Runtime
 * 
 * Server-only: Cannot be used in client components
 */

import { cache, CacheTags, revalidateCache } from './cache'

/**
 * Cache case by ID (with fallback to JSON files)
 */
export function getCachedCase(caseId: string) {
  return cache(
    async () => {
      const { getCaseByIdWithCompetencies } = await import('./db/cases')
      let caseItem = await getCaseByIdWithCompetencies(caseId)
      
      // Fallback to JSON files if not found in database
      if (!caseItem) {
        const { loadInteractiveSimulation } = await import('./case-study-loader')
        const jsonCase = loadInteractiveSimulation(caseId)
        
        if (jsonCase) {
          // Convert JSON case to database format
          return {
            id: jsonCase.caseId, // Use caseId as the ID for JSON cases
            title: jsonCase.title,
            description: jsonCase.description,
            difficulty: jsonCase.difficulty,
            estimatedMinutes: jsonCase.estimatedDuration,
            published: true,
            metadata: {
              caseId: jsonCase.caseId,
              version: jsonCase.version,
            },
            competencies: jsonCase.competencies?.map((comp: string) => ({
              competency: { name: comp }
            })) || [],
            briefingDoc: jsonCase.description || '',
            datasets: null,
            prerequisites: null,
          } as any
        }
      }
      
      return caseItem
    },
    ['case', caseId],
    {
      tags: [CacheTags.CASES, `case-${caseId}`],
      revalidate: 3600, // 1 hour
    }
  )()
}

/**
 * Revalidate case cache
 */
export async function revalidateCaseCache(caseId: string) {
  await revalidateCache(CacheTags.CASES)
  await revalidateCache(`case-${caseId}`)
}

