import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'

export interface LessonContent {
  id: string
  title: string
  domain: string
  module: string
  lesson_number: number
  duration: number
  difficulty: string
  description: string
  content: string
}

// Simple in-memory cache for loaded content
const contentCache = new Map<string, { content: LessonContent; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Load lesson content by checking multiple paths
 * Priority: 1) content/curriculum/{domain}/{module}/{lesson}.md 2) content/lessons/{lessonId}.md
 */
export function loadLessonByPath(
  domainId: string,
  moduleId: string,
  lessonId: string
): LessonContent | null {
  const cacheKey = `${domainId}:${moduleId}:${lessonId}`
  
  // Check cache first
  const cached = contentCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.content
  }

  // Try preferred path: content/curriculum/{domain}/{module}/{lesson}.md
  const preferredPath = path.join(
    process.cwd(),
    'content',
    'curriculum',
    domainId,
    moduleId,
    `${lessonId}.md`
  )

  if (fs.existsSync(preferredPath)) {
    try {
      const fileContents = fs.readFileSync(preferredPath, 'utf8')
      const { data, content } = matter(fileContents)

      const lessonContent: LessonContent = {
        id: data.id || lessonId,
        title: data.title || lessonId,
        domain: data.domain || domainId,
        module: data.module || moduleId,
        lesson_number: data.lesson_number || 0,
        duration: data.duration || 12,
        difficulty: data.difficulty || 'intermediate',
        description: data.description || '',
        content
      }

      // Cache the result
      contentCache.set(cacheKey, { content: lessonContent, timestamp: Date.now() })
      return lessonContent
    } catch (error) {
      console.error(`Error loading lesson from preferred path ${preferredPath}:`, error)
    }
  }

  // Fallback to legacy path: content/lessons/{lessonId}.md
  const fallbackPath = path.join(process.cwd(), 'content', 'lessons', `${lessonId}.md`)
  
  if (fs.existsSync(fallbackPath)) {
    try {
      const fileContents = fs.readFileSync(fallbackPath, 'utf8')
      const { data, content } = matter(fileContents)

      const lessonContent: LessonContent = {
        id: data.id || lessonId,
        title: data.title || lessonId,
        domain: data.domain || domainId,
        module: data.module || moduleId,
        lesson_number: data.lesson_number || 0,
        duration: data.duration || 12,
        difficulty: data.difficulty || 'intermediate',
        description: data.description || '',
        content
      }

      // Cache the result
      contentCache.set(cacheKey, { content: lessonContent, timestamp: Date.now() })
      return lessonContent
    } catch (error) {
      console.error(`Error loading lesson from fallback path ${fallbackPath}:`, error)
    }
  }

  return null
}

/**
 * Load lesson content by content ID (legacy function, maintained for compatibility)
 * @deprecated Use loadLessonByPath instead
 */
export function loadLessonContent(contentId: string): LessonContent | null {
  try {
    const contentPath = path.join(process.cwd(), 'content', 'lessons', `${contentId}.md`)
    
    if (!fs.existsSync(contentPath)) {
      return null
    }

    const fileContents = fs.readFileSync(contentPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      id: data.id || contentId,
      title: data.title || 'Untitled',
      domain: data.domain || '',
      module: data.module || '',
      lesson_number: data.lesson_number || 0,
      duration: data.duration || 12,
      difficulty: data.difficulty || 'beginner',
      description: data.description || '',
      content
    }
  } catch (error) {
    console.error(`Error loading lesson content for ${contentId}:`, error)
    return null
  }
}

export function getAllLessonIds(): string[] {
  try {
    const lessonsDir = path.join(process.cwd(), 'content', 'lessons')
    
    if (!fs.existsSync(lessonsDir)) {
      return []
    }

    const files = fs.readdirSync(lessonsDir)
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''))
  } catch (error) {
    console.error('Error getting lesson IDs:', error)
    return []
  }
}

export function getAllLessonsOrdered(): LessonContent[] {
  try {
    const lessonsDir = path.join(process.cwd(), 'content', 'lessons')
    
    if (!fs.existsSync(lessonsDir)) {
      return []
    }

    const files = fs.readdirSync(lessonsDir)
    const lessons: LessonContent[] = []

    for (const file of files.filter(f => f.endsWith('.md'))) {
      const contentId = file.replace('.md', '')
      const lesson = loadLessonContent(contentId)
      if (lesson) {
        lessons.push(lesson)
      }
    }

    // Sort by domain, module, then lesson_number
    lessons.sort((a, b) => {
      if (a.domain !== b.domain) {
        return a.domain.localeCompare(b.domain)
      }
      if (a.module !== b.module) {
        return a.module.localeCompare(b.module)
      }
      return a.lesson_number - b.lesson_number
    })

    return lessons
  } catch (error) {
    console.error('Error getting ordered lessons:', error)
    return []
  }
}

export function getNextLesson(currentId: string): LessonContent | null {
  const lessons = getAllLessonsOrdered()
  const currentIndex = lessons.findIndex(l => l.id === currentId)
  
  if (currentIndex === -1 || currentIndex === lessons.length - 1) {
    return null
  }
  
  return lessons[currentIndex + 1]
}

export function getPreviousLesson(currentId: string): LessonContent | null {
  const lessons = getAllLessonsOrdered()
  const currentIndex = lessons.findIndex(l => l.id === currentId)
  
  if (currentIndex <= 0) {
    return null
  }
  
  return lessons[currentIndex - 1]
}
