import { bulkCreateCases } from '@/lib/db/cases'
import { AppError } from '@/lib/db/utils'
import { prisma } from '@/lib/prisma/server'
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

    // Validate and prepare case data
    const casesWithCompetencyIds = await Promise.all(
      cases.map(async (caseData, index) => {
        // Check if case already exists (by caseId in metadata or by title)
        let existingCaseId: string | null = null
        
        // First check: if metadata.caseId exists and matches a DB case
        // This is the primary check since generate-case saves cases with caseId in metadata
        if (caseData.metadata?.caseId) {
          try {
            // Try JSON path query first (PostgreSQL JSONB)
            const existing = await prisma.case.findFirst({
              where: {
                metadata: {
                  path: ['caseId'],
                  equals: caseData.metadata.caseId,
                },
              },
              select: { id: true },
            })
            if (existing) {
              existingCaseId = existing.id
              console.log(`[bulk cases] Case with caseId "${caseData.metadata.caseId}" already exists (ID: ${existing.id}), skipping`)
            }
          } catch (err) {
            // JSON path query might not work, try alternative: search all cases and filter
            try {
              // Search by title as a starting point, then check metadata
              const allCases = await prisma.case.findMany({
                where: {
                  title: caseData.title,
                },
                select: { id: true, metadata: true },
                take: 20, // Increase limit to catch more cases
              })
              
              for (const c of allCases) {
                const meta = c.metadata as any
                if (meta?.caseId === caseData.metadata.caseId) {
                  existingCaseId = c.id
                  console.log(`[bulk cases] Case with caseId "${caseData.metadata.caseId}" already exists (found via fallback, ID: ${c.id}), skipping`)
                  break
                }
              }
            } catch (fallbackErr) {
              // If fallback also fails, try searching without title filter
              try {
                const allCases = await prisma.case.findMany({
                  select: { id: true, metadata: true },
                  take: 100, // Limit to avoid performance issues
                })
                
                for (const c of allCases) {
                  const meta = c.metadata as any
                  if (meta?.caseId === caseData.metadata.caseId) {
                    existingCaseId = c.id
                    console.log(`[bulk cases] Case with caseId "${caseData.metadata.caseId}" already exists (found via full scan, ID: ${c.id}), skipping`)
                    break
                  }
                }
              } catch (fullScanErr) {
                console.warn('[bulk cases] Could not check for duplicate caseId:', fullScanErr)
              }
            }
          }
        }
        
        // REMOVED: Title-based duplicate detection is too aggressive
        // Cases can have similar titles but be different cases (e.g., "The 'Two-Pizza Team' Re-Org" vs "The 'Two-Pizza Team' Re-Org at ScaleGrid")
        // Only use caseId-based detection which is unique and reliable
        
        // If case already exists, skip it (don't create duplicate)
        if (existingCaseId) {
          return { _skip: true, existingCaseId }
        }
        
        // Validate required fields
        if (!caseData.title) {
          throw new AppError(`Case ${index + 1}: Missing required field "title"`, 400, 'VALIDATION_ERROR')
        }
        if (!caseData.rubric) {
          throw new AppError(`Case "${caseData.title}": Missing required field "rubric"`, 400, 'VALIDATION_ERROR')
        }

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

        // Filter out any invalid competency IDs - ensure only valid strings
        const validCompetencyIds = competencyIds.filter((id): id is string => 
          typeof id === 'string' && id.length > 0
        )

        // Return case data - competencyIds can be empty array, that's fine
        return {
          title: caseData.title,
          description: caseData.description || null,
          briefingDoc: caseData.briefingDoc || null,
          datasets: caseData.datasets || null,
          rubric: caseData.rubric, // Required
          status: caseData.status || 'draft',
          published: caseData.published ?? false,
          difficulty: caseData.difficulty || null,
          estimatedMinutes: caseData.estimatedMinutes || null,
          prerequisites: caseData.prerequisites || [],
          storagePath: caseData.storagePath || null,
          metadata: caseData.metadata || {},
          competencyIds: validCompetencyIds, // Empty array is valid - case will save without competency links
        }
      })
    )
    
    // Filter out cases that already exist
    const casesToCreate = casesWithCompetencyIds.filter((c: any) => !c._skip)
    const skippedCount = casesWithCompetencyIds.length - casesToCreate.length
    
    if (casesToCreate.length === 0) {
      return NextResponse.json({ 
        success: true, 
        count: 0,
        skipped: skippedCount,
        message: skippedCount > 0 
          ? `Skipped ${skippedCount} case(s) - they already exist in database` 
          : 'No cases to save'
      }, { status: 200 })
    }

    // Save cases - even if competencyIds are empty, cases should still save
    const created = await bulkCreateCases(casesToCreate, user.id)

    // No server cache - client queries will refetch automatically
    const response = NextResponse.json({ 
      success: true, 
      count: created.count,
      skipped: skippedCount,
      message: skippedCount > 0 
        ? `Created ${created.count} case(s), skipped ${skippedCount} existing case(s)`
        : `Created ${created.count} case(s)`
    }, { status: 201 })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof AppError) {
      console.error('[bulk cases] AppError:', error.message, error.statusCode)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    // Log full error details for debugging
    console.error('[bulk cases] Error creating bulk cases:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack,
      error: error,
    })
    return NextResponse.json({ 
      error: 'Failed to create cases',
      details: error?.message || 'Unknown error',
    }, { status: 500 })
  }
}

