import fs from 'fs'
import path from 'path'
import { prisma } from './prisma/server'
import { isMissingTable } from './api/route-helpers'

export interface LearningPathItem {
  type: 'lesson' | 'case'
  domain: string
  module?: string
  lesson?: string
  caseId?: string
}

export interface LearningPath {
  id: string
  title: string
  description?: string
  duration: string
  items: LearningPathItem[]
}

/**
 * Load all curated learning paths from JSON files (fallback/seed data)
 */
function getAllLearningPathsFromJSON(): LearningPath[] {
  const pathsDir = path.join(process.cwd(), 'content', 'paths')
  
  if (!fs.existsSync(pathsDir)) {
    return []
  }

  const files = fs.readdirSync(pathsDir).filter(f => f.endsWith('.json'))
  const paths: LearningPath[] = []

  for (const file of files) {
    try {
      const filePath = path.join(pathsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const pathData = JSON.parse(content) as LearningPath
      paths.push(pathData)
    } catch (error) {
      console.error(`Error loading learning path from ${file}:`, error)
    }
  }

  return paths
}

/**
 * Load all learning paths from database (published only, or all for admin)
 * Falls back to JSON if database is empty
 */
export async function getAllLearningPaths(includeDrafts: boolean = false): Promise<LearningPath[]> {
  try {
    const paths = await prisma.learningPath.findMany({
      where: includeDrafts ? undefined : { status: 'published' },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (paths.length > 0) {
      return paths.map(p => ({
        id: p.slug,
        title: p.title,
        description: p.description || undefined,
        duration: p.duration,
        items: p.items.map(item => ({
          type: item.type as 'lesson' | 'case',
          domain: item.domain || '',
          module: item.module || undefined,
          lesson: item.lesson || undefined,
          caseId: item.caseId || undefined,
        })),
      }))
    }

    // Fallback to JSON if database is empty
    return getAllLearningPathsFromJSON()
  } catch (error: any) {
    // Handle missing table gracefully (P2021) - expected if migrations haven't run
    if (isMissingTable(error)) {
      // Silently fallback to JSON for missing table
      return getAllLearningPathsFromJSON()
    }
    
    // Log other errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading learning paths from database:', error)
    }
    // Fallback to JSON on error
    return getAllLearningPathsFromJSON()
  }
}

/**
 * Get a specific learning path by ID (slug) from database
 * Falls back to JSON if not found
 */
export async function getLearningPathById(pathId: string): Promise<LearningPath | null> {
  try {
    const path = await prisma.learningPath.findUnique({
      where: { slug: pathId },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (path) {
      return {
        id: path.slug,
        title: path.title,
        description: path.description || undefined,
        duration: path.duration,
        items: path.items.map(item => ({
          type: item.type as 'lesson' | 'case',
          domain: item.domain || '',
          module: item.module || undefined,
          lesson: item.lesson || undefined,
          caseId: item.caseId || undefined,
        })),
      }
    }

    // Fallback to JSON
    const jsonPaths = getAllLearningPathsFromJSON()
    return jsonPaths.find(p => p.id === pathId) || null
  } catch (error: any) {
    // Handle missing table gracefully (P2021) - expected if migrations haven't run
    if (isMissingTable(error)) {
      // Silently fallback to JSON for missing table
      const jsonPaths = getAllLearningPathsFromJSON()
      return jsonPaths.find(p => p.id === pathId) || null
    }
    
    // Log other errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading learning path from database:', error)
    }
    // Fallback to JSON
    const jsonPaths = getAllLearningPathsFromJSON()
    return jsonPaths.find(p => p.id === pathId) || null
  }
}

/**
 * Get learning path that contains a specific case study
 */
export async function getLearningPathByCaseId(caseId: string): Promise<LearningPath | null> {
  try {
    const pathItem = await prisma.learningPathItem.findFirst({
      where: {
        caseId,
        path: {
          status: 'published',
        },
      },
      include: {
        path: {
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (pathItem?.path) {
      const p = pathItem.path
      return {
        id: p.slug,
        title: p.title,
        description: p.description || undefined,
        duration: p.duration,
        items: p.items.map(item => ({
          type: item.type as 'lesson' | 'case',
          domain: item.domain || '',
          module: item.module || undefined,
          lesson: item.lesson || undefined,
          caseId: item.caseId || undefined,
        })),
      }
    }

    // Fallback to JSON
    const jsonPaths = getAllLearningPathsFromJSON()
    return jsonPaths.find(path => 
      path.items.some(item => item.type === 'case' && item.caseId === caseId)
    ) || null
  } catch (error: any) {
    // Handle missing table gracefully (P2021) - expected if migrations haven't run
    if (isMissingTable(error)) {
      // Silently fallback to JSON for missing table
      const jsonPaths = getAllLearningPathsFromJSON()
      return jsonPaths.find(path => 
        path.items.some(item => item.type === 'case' && item.caseId === caseId)
      ) || null
    }
    
    // Log other errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error finding learning path by case ID:', error)
    }
    // Fallback to JSON
    const jsonPaths = getAllLearningPathsFromJSON()
    return jsonPaths.find(path => 
      path.items.some(item => item.type === 'case' && item.caseId === caseId)
    ) || null
  }
}

/**
 * Search lessons and cases for admin UI
 * Returns lessons and cases that can be added to a learning path
 */
export async function searchLessonsAndCases(query: string = '', limit: number = 20) {
  const { getAllLessonsFlat } = await import('./curriculum-data')
  const { getAllInteractiveSimulations } = await import('./case-study-loader')
  
  const allLessons = getAllLessonsFlat()
  const allCases = getAllInteractiveSimulations()
  
  const normalizedQuery = query.toLowerCase().trim()
  
  const matchingLessons = allLessons
    .filter(lesson => {
      if (!normalizedQuery) return true
      return (
        lesson.lessonTitle.toLowerCase().includes(normalizedQuery) ||
        lesson.moduleTitle.toLowerCase().includes(normalizedQuery) ||
        lesson.domainTitle.toLowerCase().includes(normalizedQuery)
      )
    })
    .slice(0, limit)
    .map(lesson => ({
      type: 'lesson' as const,
      id: `${lesson.domain}-${lesson.moduleId}-${lesson.lessonId}`,
      title: lesson.lessonTitle,
      domain: lesson.domain,
      module: lesson.moduleId,
      lesson: lesson.lessonId,
      metadata: {
        moduleTitle: lesson.moduleTitle,
        domainTitle: lesson.domainTitle,
      },
    }))
  
  const matchingCases = allCases
    .filter(caseItem => {
      if (!normalizedQuery) return true
      return caseItem.title.toLowerCase().includes(normalizedQuery)
    })
    .slice(0, limit)
    .map(caseItem => ({
      type: 'case' as const,
      id: caseItem.caseId,
      title: caseItem.title,
      caseId: caseItem.caseId,
      metadata: {
        description: caseItem.description,
      },
    }))
  
  return {
    lessons: matchingLessons,
    cases: matchingCases,
  }
}

