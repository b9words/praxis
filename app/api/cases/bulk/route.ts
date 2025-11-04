import { bulkCreateCases } from '@/lib/db/cases'
import { AppError } from '@/lib/db/utils'
import { prisma } from '@/lib/prisma/server'
import { revalidateCache, CacheTags } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

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
      console.warn(`[Non-blocking] Competency not found: "${name}" - case will be saved without this competency`)
    }
  }
  
  return competencyIds
}

/**
 * POST /api/cases/bulk
 * Bulk create cases
 * Body: { cases: Array<{ title, description, rubric, storagePath, competencyIds, metadata.competencyName, ... }> }
 */
export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    
    const body = await request.json()
    const { cases } = body

    if (!Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json({ error: 'Cases array required' }, { status: 400 })
    }

    // Resolve competency IDs for each case (non-blocking - cases will save even if competencies aren't found)
    const casesWithCompetencyIds = await Promise.all(
      cases.map(async (caseData) => {
        let competencyIds = caseData.competencyIds || []
        
        // If no competencyIds provided, try to resolve from metadata.competencyName
        if (competencyIds.length === 0 && caseData.metadata?.competencyName) {
          try {
            const resolved = await resolveCompetencyIds([caseData.metadata.competencyName])
            competencyIds = resolved
          } catch (error) {
            console.warn(`[Non-blocking] Failed to resolve competency for case "${caseData.title}":`, error)
            // Continue with empty array
          }
        }
        
        // Also check metadata.competencies array
        if (competencyIds.length === 0 && Array.isArray(caseData.metadata?.competencies)) {
          try {
            const resolved = await resolveCompetencyIds(caseData.metadata.competencies)
            competencyIds = resolved
          } catch (error) {
            console.warn(`[Non-blocking] Failed to resolve competencies for case "${caseData.title}":`, error)
            // Continue with empty array
          }
        }

        // Return case data - competencyIds can be empty array, that's fine
        return {
          ...caseData,
          competencyIds, // Empty array is valid - case will save without competency links
        }
      })
    )

    // Save cases - even if competencyIds are empty, cases should still save
    const created = await bulkCreateCases(casesWithCompetencyIds, user.id)

    // Revalidate Next.js cache so the page shows new cases immediately
    await revalidateCache(CacheTags.CASES)
    await revalidateCache('admin')
    await revalidateCache('content')

    return NextResponse.json({ success: true, count: created.count }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error creating bulk cases:', error)
    return NextResponse.json({ error: 'Failed to create cases' }, { status: 500 })
  }
}

