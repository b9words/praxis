import BookmarkButton from '@/components/library/BookmarkButton'
import LessonViewTracker from '@/components/library/LessonViewTracker'
import ProgressTracker from '@/components/library/ProgressTracker'
import { Button } from '@/components/ui/button'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { loadLessonByPath } from '@/lib/content-loader'
import { getAllLessonsFlat, getDomainById, getLessonById, getModuleById } from '@/lib/curriculum-data'
import { prisma } from '@/lib/prisma/server'
import { fetchFromStorageServer } from '@/lib/supabase/storage'
import { ChevronLeft, ChevronRight, Clock, Target } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface LessonPageProps {
  params: Promise<{
    domain: string
    module: string
    lesson: string
  }>
}

// Helper function to get next lesson in sequence (across modules and domains)
function getNextLessonInSequence(domainId: string, moduleId: string, lessonId: string) {
  const allLessons = getAllLessonsFlat()
  const currentIndex = allLessons.findIndex(
    l => l.domain === domainId && l.moduleId === moduleId && l.lessonId === lessonId
  )
  
  if (currentIndex === -1 || currentIndex === allLessons.length - 1) {
    return null
  }
  
  const nextLesson = allLessons[currentIndex + 1]
  return {
    domainId: nextLesson.domain,
    moduleId: nextLesson.moduleId,
    lessonId: nextLesson.lessonId
  }
}

// Helper function to get previous lesson in sequence (across modules and domains)
function getPreviousLessonInSequence(domainId: string, moduleId: string, lessonId: string) {
  const allLessons = getAllLessonsFlat()
  const currentIndex = allLessons.findIndex(
    l => l.domain === domainId && l.moduleId === moduleId && l.lessonId === lessonId
  )
  
  if (currentIndex <= 0) {
    return null
  }
  
  const previousLesson = allLessons[currentIndex - 1]
  return {
    domainId: previousLesson.domain,
    moduleId: previousLesson.moduleId,
    lessonId: previousLesson.lessonId
  }
}

// Helper function to generate fallback content
function generateFallbackContent(
  domainId: string, 
  moduleId: string, 
  lessonId: string,
  domain?: any,
  module?: any,
  lesson?: any
): string {
  const lessonTitle = lesson?.title || 'Untitled Lesson'
  const lessonDescription = lesson?.description || 'This lesson provides comprehensive insights.'
  const domainTitle = domain?.title || 'Domain'
  const moduleTitle = module?.title || 'Module'
  
  return `# ${lessonTitle}

## Executive Summary

${lessonDescription}

This lesson provides a comprehensive framework for understanding and applying the core concepts that drive executive decision-making in this critical area.

**Key Learning Objectives:**
- Master the fundamental principles and frameworks
- Understand real-world applications through case studies
- Develop practical skills for immediate implementation
- Learn to avoid common pitfalls and mistakes

---

## Core Principle

The foundation of this lesson rests on understanding that every business decision has multiple layers of complexity and consequence. As a CEO, your role is to see beyond the immediate effects and understand the systemic implications of your choices.

### The Strategic Framework

This lesson introduces a systematic approach to decision-making that considers:

1. **Immediate Impact**: Direct, measurable effects
2. **Secondary Effects**: Indirect consequences that emerge over time
3. **Systemic Implications**: How decisions affect the broader organization
4. **Long-term Value Creation**: Sustainable competitive advantage

### Why This Matters for CEOs

In today's complex business environment, the ability to think systematically and strategically is what separates exceptional leaders from the rest. This framework provides the mental models necessary to navigate uncertainty and create lasting value.

---

## Implementation Framework

\`\`\`mermaid
flowchart TD
    A[Assess Situation] --> B{Strategic Options}
    B --> C[Option 1: Conservative]
    B --> D[Option 2: Moderate]
    B --> E[Option 3: Aggressive]
    C --> F[Risk Assessment]
    D --> F
    E --> F
    F --> G[Decision Matrix]
    G --> H[Implementation Plan]
    H --> I[Monitor & Adjust]
\`\`\`

### Decision Criteria

| Factor | Weight | Conservative | Moderate | Aggressive |
|--------|--------|-------------|----------|------------|
| **Risk Level** | 30% | Low | Medium | High |
| **Resource Requirements** | 25% | Minimal | Moderate | Significant |
| **Time Horizon** | 20% | Short | Medium | Long |
| **Expected ROI** | 25% | 10-15% | 20-30% | 35%+ |

---

## Key Takeaways

- **Framework-driven thinking** enables consistent, high-quality decisions
- **Systematic analysis** reduces the risk of costly mistakes
- **Long-term perspective** creates sustainable competitive advantage
- **Continuous monitoring** allows for course correction and optimization
- **Stakeholder alignment** ensures successful implementation

---

*This lesson is part of **${domainTitle}** → **${moduleTitle}** in the Praxis Executive Education curriculum.*

> **Note**: This lesson content is being prepared. The full content will be available soon.`
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { domain: domainId, module: moduleId, lesson: lessonId } = await params
  
  // Try to load from database first with error handling
  let articleFromDb = null
  try {
    // First try with enum value (if enum exists in DB)
    articleFromDb = await prisma.article.findFirst({
      where: {
        status: 'published',
        storagePath: {
          contains: `${domainId}/${moduleId}/${lessonId}.md`,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        storagePath: true,
        metadata: true,
        status: true,
      },
    })
  } catch (error: any) {
    // If enum doesn't exist in DB, try querying without status filter
    if (error?.code === 'P2034' || error?.message?.includes('ContentStatus') || error?.message?.includes('42704')) {
      // Import error suppression helper
      const { logErrorOnce } = await import('@/lib/prisma-enum-fallback')
      logErrorOnce('ContentStatus enum not found, using fallback', error, 'warn')
      try {
        articleFromDb = await prisma.article.findFirst({
          where: {
            storagePath: {
              contains: `${domainId}/${moduleId}/${lessonId}.md`,
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            storagePath: true,
            metadata: true,
            status: true,
          },
        })
      } catch (fallbackError) {
        console.error('Error fetching article from database:', fallbackError)
      }
    } else {
      console.error('Error fetching article from database:', error)
    }
  }

  let lessonContent: string
  let lessonDuration = 12
  let lessonDifficulty = 'intermediate'
  let lessonTitle = ''
  let lessonDescription = ''

  // If found in database, fetch content from storage
  if (articleFromDb && articleFromDb.storagePath) {
    lessonTitle = articleFromDb.title
    lessonDescription = articleFromDb.description || ''
    
    const metadata = (articleFromDb.metadata || {}) as Record<string, any>
    lessonDuration = metadata.duration || 12
    lessonDifficulty = metadata.difficulty || 'intermediate'
    
    // Fetch full markdown content from Supabase Storage
    const { success, content, error } = await fetchFromStorageServer(articleFromDb.storagePath)
    
    if (success && content) {
      lessonContent = content
    } else {
      console.error('Failed to fetch from storage:', error)
      // Fall back to local file system
      const lessonContentData = loadLessonByPath(domainId, moduleId, lessonId)
      if (lessonContentData && lessonContentData.content) {
        lessonContent = lessonContentData.content
        lessonDuration = lessonContentData.duration || 12
        lessonDifficulty = lessonContentData.difficulty || 'intermediate'
        lessonTitle = lessonContentData.title
        lessonDescription = lessonContentData.description
      } else {
        // If no content anywhere, use fallback
        lessonContent = generateFallbackContent(domainId, moduleId, lessonId)
      }
    }
  } else {
    // Fall back to hardcoded curriculum data and local file system
    const domain = getDomainById(domainId)
    const module = getModuleById(domainId, moduleId)
    const lesson = getLessonById(domainId, moduleId, lessonId)

    if (!domain || !module || !lesson) {
      notFound()
    }

    lessonTitle = lesson.title
    lessonDescription = lesson.description

    // Load actual lesson content from markdown files
    const lessonContentData = loadLessonByPath(domainId, moduleId, lessonId)
    
    if (lessonContentData && lessonContentData.content) {
      lessonContent = lessonContentData.content
      lessonDuration = lessonContentData.duration || 12
      lessonDifficulty = lessonContentData.difficulty || 'intermediate'
    } else {
      // Fallback content generation
      lessonContent = generateFallbackContent(domainId, moduleId, lessonId, domain, module, lesson)
      lessonDuration = 12
      lessonDifficulty = 'intermediate'
    }
  }

  // Get domain/module for breadcrumbs (try from hardcoded data first)
  const domain = getDomainById(domainId)
  const module = getModuleById(domainId, moduleId)
  const lesson = getLessonById(domainId, moduleId, lessonId)
  
  if (!domain || !module || !lesson) {
    // If not in hardcoded data, try to construct from article metadata
    if (!articleFromDb) {
      notFound()
    }
  }

  const nextLesson = getNextLessonInSequence(domainId, moduleId, lessonId)
  const previousLesson = getPreviousLessonInSequence(domainId, moduleId, lessonId)
  
  // Get user info for progress tracking
  const { getCurrentUser } = await import('@/lib/auth/get-user')
  const user = await getCurrentUser()
  
  // Get current progress if user is logged in
  let currentProgress = null
  if (user) {
    const progress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_domainId_moduleId_lessonId: {
          userId: user.id,
          domainId,
          moduleId,
          lessonId,
        },
      },
    })
    
    if (progress) {
      // Convert to expected format
      currentProgress = {
        id: progress.id,
        user_id: progress.userId,
        domain_id: progress.domainId,
        module_id: progress.moduleId,
        lesson_id: progress.lessonId,
        status: progress.status,
        progress_percentage: progress.progressPercentage,
        time_spent_seconds: progress.timeSpentSeconds,
        last_read_position: progress.lastReadPosition as Record<string, any>,
        completed_at: progress.completedAt?.toISOString() || null,
        bookmarked: progress.bookmarked,
        created_at: progress.createdAt.toISOString(),
        updated_at: progress.updatedAt.toISOString(),
      }
    }
  }

  // Use article title or fall back to lesson title
  const displayTitle = lessonTitle || (lesson ? lesson.title : 'Untitled Lesson')
  const displayModuleNumber = lesson ? lesson.number : 1
  const displayModuleTitle = module ? module.title : 'Module'
  const displayDomainTitle = domain ? domain.title : 'Domain'

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Desktop Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
          <div className="px-6 py-4 pb-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4 uppercase tracking-wide">
              <Link href="/library/curriculum" className="hover:text-neutral-700 font-medium">
                DOMAINS
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/library/curriculum/${domainId}`} className="hover:text-neutral-700 font-medium">
                {displayDomainTitle}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-neutral-700 font-medium">{displayModuleTitle}</span>
            </div>

            {/* Title */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-neutral-500 font-mono">
                    {String(module?.number || displayModuleNumber).padStart(2, '0')}.{String(lesson?.number || 1).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{lessonDuration} MIN</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{lessonDifficulty.toUpperCase()}</span>
                    </div>
                    {currentProgress && currentProgress.progress_percentage > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-700 font-medium">{currentProgress.progress_percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
                {user && (
                  <BookmarkButton
                    domainId={domainId}
                    moduleId={moduleId}
                    lessonId={lessonId}
                    initialBookmarked={currentProgress?.bookmarked || false}
                  />
                )}
              </div>
              <h1 className="text-xl font-semibold leading-tight text-neutral-900">{displayTitle}</h1>
            </div>
          </div>

        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl">
            <div className="prose prose-neutral max-w-none">
              <MarkdownRenderer content={lessonContent} />
            </div>
            
            {/* Analytics Tracking */}
            {user && (
              <LessonViewTracker
                lessonId={lessonId}
                domainId={domainId}
                moduleId={moduleId}
                userId={user.id}
              />
            )}

            {/* Progress Tracker */}
            {user && (
              <ProgressTracker
                userId={user.id}
                domainId={domainId}
                moduleId={moduleId}
                lessonId={lessonId}
                initialProgress={currentProgress?.progress_percentage || 0}
                initialStatus={currentProgress?.status || 'not_started'}
                initialTimeSpent={currentProgress?.time_spent_seconds || 0}
                initialScrollPosition={currentProgress?.last_read_position?.scrollTop}
              />
            )}

            {/* Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 mt-8 border-t border-neutral-200 gap-4">
              <Button variant="outline" size="sm" asChild className="h-8 px-2.5 border-gray-300 hover:border-gray-400 rounded-none text-xs uppercase tracking-wide">
                <Link href={`/library/curriculum/${domainId}/${moduleId}`}>
                  <ChevronLeft className="mr-2 h-3 w-3" />
                  MODULE
                </Link>
              </Button>
              <div className="flex gap-2">
                {previousLesson ? (
                  <Button variant="outline" size="sm" asChild className="h-8 px-2.5 border-gray-300 hover:border-gray-400 rounded-none text-xs uppercase tracking-wide">
                    <Link href={`/library/curriculum/${previousLesson.domainId}/${previousLesson.moduleId}/${previousLesson.lessonId}`}>
                      <ChevronLeft className="mr-2 h-3 w-3" />
                      PREVIOUS
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="h-8 px-2.5 border-gray-200 text-gray-400 rounded-none text-xs uppercase tracking-wide">
                    <ChevronLeft className="mr-2 h-3 w-3" />
                    PREVIOUS
                  </Button>
                )}
                
                {nextLesson ? (
                  <Button size="sm" asChild className="h-8 px-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-none text-xs uppercase tracking-wide">
                    <Link href={`/library/curriculum/${nextLesson.domainId}/${nextLesson.moduleId}/${nextLesson.lessonId}`}>
                      NEXT
                      <ChevronRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" disabled className="h-8 px-2.5 bg-gray-400 text-white rounded-none text-xs uppercase tracking-wide">
                    NEXT
                    <ChevronRight className="ml-2 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
