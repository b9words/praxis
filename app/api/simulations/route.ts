import { requireAuth } from '@/lib/auth/authorize'
import { isEnumError } from '@/lib/prisma-enum-fallback'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const caseId = searchParams.get('caseId')

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }
    if (caseId) {
      where.caseId = caseId
    }

    let simulations: any[] = []
    try {
      simulations = await prisma.simulation.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              title: true,
            },
          },
          debrief: {
            select: {
              id: true,
              scores: true,
              summaryText: true,
              radarChartData: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error: any) {
      if (isEnumError(error)) {
        // Fallback: query without status filter, filter by completedAt
        const fallbackWhere: any = {
          userId: user.id,
        }
        if (caseId) {
          fallbackWhere.caseId = caseId
        }
        
        const allSimulations = await prisma.simulation.findMany({
          where: fallbackWhere,
          include: {
            case: {
              select: {
                id: true,
                title: true,
              },
            },
            debrief: {
              select: {
                id: true,
                scores: true,
                summaryText: true,
                radarChartData: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        
        // Filter by status using completedAt
        if (status === 'completed') {
          simulations = allSimulations.filter((s: any) => s.completedAt !== null)
        } else if (status === 'in_progress') {
          simulations = allSimulations.filter((s: any) => s.completedAt === null)
        } else {
          simulations = allSimulations
        }
      } else {
        throw error
      }
    }

    return NextResponse.json({ simulations })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching simulations:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { caseId, userInputs = {} } = body

    if (!caseId) {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 })
    }

    // Check if simulation already exists
    const existing = await prisma.simulation.findFirst({
      where: {
        userId: user.id,
        caseId,
      },
    })

    if (existing) {
      return NextResponse.json({ simulation: existing }, { status: 200 })
    }

    let simulation: any = null
    try {
      simulation = await prisma.simulation.create({
        data: {
          userId: user.id,
          caseId,
          userInputs,
          status: 'in_progress',
        },
        include: {
          case: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })
    } catch (error: any) {
      if (isEnumError(error)) {
        // Fallback: use raw SQL to create simulation
        try {
          const simulationId = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
            INSERT INTO simulations (id, user_id, case_id, user_inputs, status, started_at, created_at, updated_at)
            VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::jsonb, $4::text, NOW(), NOW(), NOW())
            RETURNING id
          `, user.id, caseId, JSON.stringify(userInputs || {}), 'in_progress')
          
          if (simulationId && simulationId[0]) {
            // Fetch the created simulation
            const created = await prisma.simulation.findUnique({
              where: { id: simulationId[0].id },
              include: {
                case: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            })
            if (created) {
              simulation = created
            }
          }
        } catch (rawError) {
          console.error('Error creating simulation with raw SQL:', rawError)
          throw rawError
        }
      } else {
        throw error
      }
    }

    if (!simulation) {
      return NextResponse.json({ error: 'Failed to create simulation' }, { status: 500 })
    }

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error creating simulation:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

