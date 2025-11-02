
import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    // Cache cases list (15 minutes revalidate)
    const getCachedCases = cache(
      async () => {
        const where: any = {}
        if (status) {
          where.status = status
        }

        let cases: any[] = []
        try {
          cases = await prisma.case.findMany({
            where,
            include: {
              creator: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                },
              },
              competencies: {
                include: {
                  competency: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        } catch (error: any) {
          // Handle missing columns (P2022) or other schema issues
          if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
            try {
              // Fallback: explicit select without problematic columns
              cases = await prisma.case.findMany({
                where,
                select: {
                  id: true,
                  title: true,
                  briefingDoc: true,
                  description: true,
                  datasets: true,
                  rubric: true,
                  status: true,
                  difficulty: true,
                  estimatedMinutes: true,
                  prerequisites: true,
                  storagePath: true,
                  metadata: true,
                  createdAt: true,
                  updatedAt: true,
                  createdBy: true,
                  updatedBy: true,
                  creator: {
                    select: {
                      id: true,
                      username: true,
                      fullName: true,
                    },
                  },
                  competencies: {
                    select: {
                      competency: {
                        select: {
                          id: true,
                          name: true,
                          description: true,
                          level: true,
                          residencyYear: true,
                          displayOrder: true,
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              })
            } catch (fallbackError) {
              console.error('Error fetching cases (fallback):', fallbackError)
            }
          } else {
            throw error
          }
        }

        return cases
      },
      ['api', 'cases', status || 'all'],
      {
        tags: [CacheTags.CASES],
        revalidate: 900, // 15 minutes
      }
    )

    const cases = await getCachedCases()

    return NextResponse.json({ cases })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching cases:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const body = await request.json()

    const {
      title,
      briefingDoc,
      description,
      datasets,
      rubric,
      status = 'draft',
      difficulty,
      estimatedMinutes,
      prerequisites,
      storagePath,
      metadata,
      competencyIds = [],
    } = body

    if (!title || !rubric) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let caseItem: any = null
    try {
      caseItem = await prisma.case.create({
        data: {
          title,
          briefingDoc: briefingDoc || null,
          description,
          datasets: datasets || null,
          rubric,
          status,
          difficulty,
          estimatedMinutes,
          prerequisites: prerequisites || [],
          storagePath,
          metadata: metadata || {},
          createdBy: user.id,
          updatedBy: user.id,
          competencies: {
            create: competencyIds.map((compId: string) => ({
              competencyId: compId,
            })),
          },
        },
        include: {
          competencies: {
            include: {
              competency: true,
            },
          },
        },
      })
    } catch (error: any) {
      // Handle missing columns (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
          caseItem = await prisma.case.create({
            data: {
              title,
              briefingDoc: briefingDoc || null,
              description,
              datasets: datasets || null,
              rubric,
              status,
              difficulty,
              estimatedMinutes,
              prerequisites: prerequisites || [],
              storagePath,
              metadata: metadata || {},
              createdBy: user.id,
              updatedBy: user.id,
              competencies: {
                create: competencyIds.map((compId: string) => ({
                  competencyId: compId,
                })),
              },
            },
            select: {
              id: true,
              title: true,
              briefingDoc: true,
              description: true,
              datasets: true,
              rubric: true,
              status: true,
              difficulty: true,
              estimatedMinutes: true,
              prerequisites: true,
              storagePath: true,
              metadata: true,
              createdAt: true,
              updatedAt: true,
              createdBy: true,
              updatedBy: true,
              competencies: {
                select: {
                  competency: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      level: true,
                      residencyYear: true,
                      displayOrder: true,
                    },
                  },
                },
              },
            },
          })
        } catch (fallbackError) {
          throw fallbackError
        }
      } else {
        throw error
      }
    }

    return NextResponse.json({ case: caseItem }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error creating case:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

