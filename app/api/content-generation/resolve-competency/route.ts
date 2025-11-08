import { prisma } from '@/lib/prisma/server'
import { completeCurriculumData } from '@/lib/curriculum-data'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Shared logic to resolve competency from lesson metadata
 * Returns { competencyId: string | null } - null if no competency can be found
 */
async function resolveCompetency(domainId: string | null, moduleId: string | null, lessonTitle: string | null): Promise<{ competencyId: string | null }> {
  try {
    console.log('[resolve-competency] Request:', { domainId, moduleId, lessonTitle })

    if (!domainId) {
      throw new Error('Domain ID is required')
    }

    const domain = completeCurriculumData.find(d => d.id === domainId)
    if (!domain) {
      console.log('[resolve-competency] Domain not found:', domainId)
      // Try to find any competency with domain name match as fallback
      const fallbackComp = await prisma.competency.findFirst({
        where: {
          level: 'domain',
        },
        select: { id: true },
      })
      if (fallbackComp) {
        console.log('[resolve-competency] Using fallback domain competency')
        return { competencyId: fallbackComp.id }
      }
      // If no fallback found, return null instead of throwing
      console.warn('[resolve-competency] Domain not found in curriculum and no fallback competency available')
      return { competencyId: null }
    }

    console.log('[resolve-competency] Found domain:', domain.title)

    // Get domain competency - try exact match first, then partial
    let domainComp = await prisma.competency.findFirst({
      where: {
        level: 'domain',
        name: {
          equals: domain.title,
          mode: 'insensitive',
        },
      },
      select: { id: true, name: true },
    })

    if (!domainComp) {
      // Try contains match
      domainComp = await prisma.competency.findFirst({
        where: {
          level: 'domain',
          name: {
            contains: domain.title,
            mode: 'insensitive',
          },
        },
        select: { id: true, name: true },
      })
    }

    // If still not found, try matching by checking if domain title contains competency name
    if (!domainComp) {
      const allDomainComps = await prisma.competency.findMany({
        where: {
          level: 'domain',
        },
        select: { id: true, name: true },
      })
      domainComp = allDomainComps.find(comp => 
        domain.title.toLowerCase().includes(comp.name.toLowerCase()) ||
        comp.name.toLowerCase().includes(domain.title.toLowerCase())
      ) || null
    }

    if (!domainComp) {
      console.log('[resolve-competency] Domain competency not found for:', domain.title)
      // Return first domain competency as ultimate fallback
      const firstDomain = await prisma.competency.findFirst({
        where: { level: 'domain' },
        select: { id: true },
      })
      if (firstDomain) {
        console.log('[resolve-competency] Using first available domain competency as fallback')
        return { competencyId: firstDomain.id }
      }
      // If no domain competencies exist at all, return null instead of throwing
      console.warn('[resolve-competency] No domain competencies found in database, returning null')
      return { competencyId: null }
    }

    console.log('[resolve-competency] Found domain competency:', domainComp.name)

    // If no module provided, return domain competency
    if (!moduleId) {
      return { competencyId: domainComp.id }
    }

    // Get module competency (parent of micro-skills)
    const module = domain.modules.find(m => m.id === moduleId)
    if (!module) {
      return { competencyId: domainComp.id }
    }

    let moduleComp = await prisma.competency.findFirst({
      where: {
        level: 'competency',
        parentId: domainComp.id,
        name: {
          equals: module.title,
          mode: 'insensitive',
        },
      },
      select: { id: true, name: true },
    })

    if (!moduleComp) {
      moduleComp = await prisma.competency.findFirst({
        where: {
          level: 'competency',
          parentId: domainComp.id,
          name: {
            contains: module.title,
            mode: 'insensitive',
          },
        },
        select: { id: true, name: true },
      })
    }

    // Try reverse match if still not found
    if (!moduleComp) {
      const allModuleComps = await prisma.competency.findMany({
        where: {
          level: 'competency',
          parentId: domainComp.id,
        },
        select: { id: true, name: true },
      })
      moduleComp = allModuleComps.find(comp => 
        module.title.toLowerCase().includes(comp.name.toLowerCase()) ||
        comp.name.toLowerCase().includes(module.title.toLowerCase())
      ) || null
    }

    if (!moduleComp) {
      console.log('[resolve-competency] Module competency not found, using domain competency')
      return { competencyId: domainComp.id }
    }

    console.log('[resolve-competency] Found module competency:', moduleComp.name)

    // If no lesson title provided, return module competency
    if (!lessonTitle) {
      return { competencyId: moduleComp.id }
    }

    // Get micro-skill (lesson) competency
    let microSkill = await prisma.competency.findFirst({
      where: {
        level: 'micro_skill',
        parentId: moduleComp.id,
        name: {
          equals: lessonTitle,
          mode: 'insensitive',
        },
      },
      select: { id: true, name: true },
    })

    if (!microSkill) {
      microSkill = await prisma.competency.findFirst({
        where: {
          level: 'micro_skill',
          parentId: moduleComp.id,
          name: {
            contains: lessonTitle,
            mode: 'insensitive',
          },
        },
        select: { id: true, name: true },
      })
    }

    // Try reverse match if still not found
    if (!microSkill) {
      const allMicroSkills = await prisma.competency.findMany({
        where: {
          level: 'micro_skill',
          parentId: moduleComp.id,
        },
        select: { id: true, name: true },
      })
      microSkill = allMicroSkills.find(comp => 
        lessonTitle.toLowerCase().includes(comp.name.toLowerCase()) ||
        comp.name.toLowerCase().includes(lessonTitle.toLowerCase())
      ) || null
    }

    if (microSkill) {
      console.log('[resolve-competency] Found micro-skill competency:', microSkill.name)
      return { competencyId: microSkill.id }
    }

    // Fallback to module competency
    console.log('[resolve-competency] Using module competency as fallback')
    return { competencyId: moduleComp.id }
  } catch (error) {
    console.error('Error resolving competency:', error)
    throw error
  }
}

/**
 * POST /api/content-generation/resolve-competency
 * Resolve competency ID from lesson metadata (domain, module, lesson)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domainId, moduleId, lessonTitle } = body
    const result = await resolveCompetency(domainId, moduleId, lessonTitle)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST resolve-competency:', error)
    return NextResponse.json(
      { error: 'Failed to resolve competency', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/content-generation/resolve-competency?domainId=...&moduleId=...&lessonTitle=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const domainId = searchParams.get('domainId')
    const moduleId = searchParams.get('moduleId')
    const lessonTitle = searchParams.get('lessonTitle')
    
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 })
    }
    
    const result = await resolveCompetency(domainId, moduleId, lessonTitle)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET resolve-competency:', error)
    return NextResponse.json(
      { error: 'Failed to resolve competency', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

