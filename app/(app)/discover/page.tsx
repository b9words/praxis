import { getCurrentUser } from '@/lib/auth/get-user'
import { cache, CacheTags, getCachedUserData } from '@/lib/cache'
import { getAllLearningPaths } from '@/lib/learning-paths'
import { getLessonProgressList } from '@/lib/db/progress'
import { getCompletedSimulationByUserAndCase } from '@/lib/db/simulations'
import { createThemedCollections, getModuleCollections } from '@/lib/content-collections'
import ContentShelf from '@/components/dashboard/shelves/ContentShelf'
import LearningPathCard from '@/components/dashboard/cards/LearningPathCard'
import LessonCard from '@/components/dashboard/cards/LessonCard'
import CaseCard from '@/components/dashboard/cards/CaseCard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover | Execemy',
  description: 'Explore curated learning paths and themed collections',
}

export const dynamic = 'force-dynamic'

export default async function DiscoverPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Cache learning paths (1 hour revalidate)
  const getCachedPaths = cache(
    async () => getAllLearningPaths(),
    ['discover', 'paths', 'all'],
    {
      tags: [CacheTags.CURRICULUM],
      revalidate: 3600, // 1 hour
    }
  )
  
  // Cache user lesson progress (2 minutes revalidate)
  const getCachedLessonProgress = getCachedUserData(
    user.id,
    async () => {
      return await getLessonProgressList(user.id).catch(() => [])
    },
    ['lesson', 'progress', 'discover'],
    {
      tags: [CacheTags.USER_PROGRESS],
      revalidate: 120, // 2 minutes
    }
  )

  // Get user's completed lesson IDs for themed collections
  const getCachedCompletedIds = getCachedUserData(
    user.id,
    async () => {
      const progress = await getLessonProgressList(user.id).catch(() => [])
      return new Set(
        progress
          .filter((p: any) => p.status === 'completed')
          .map((p: any) => `${p.domainId}-${p.moduleId}-${p.lessonId}`)
      )
    },
    ['completed', 'ids', 'discover'],
    {
      tags: [CacheTags.USER_PROGRESS],
      revalidate: 120, // 2 minutes
    }
  )
  
  const [allPaths, lessonProgress, userCompletedIds] = await Promise.all([
    getCachedPaths(),
    getCachedLessonProgress(),
    getCachedCompletedIds(),
  ])

  // Compute progress for learning paths
  const pathsWithProgress = await Promise.all(
    allPaths.map(async (path) => {
      let completedCount = 0
      const totalItems = path.items.length

      for (const item of path.items) {
        if (item.type === 'lesson') {
          const progress = lessonProgress.find(
            (p: any) => p.domainId === item.domain &&
                 p.moduleId === item.module &&
                 p.lessonId === item.lesson &&
                 p.status === 'completed'
          )
          if (progress) {
            completedCount++
          }
        } else if (item.type === 'case' && item.caseId) {
          const simulation = await getCompletedSimulationByUserAndCase(user.id, item.caseId).catch(() => null)
          if (simulation) {
            completedCount++
          }
        }
      }

      return {
        ...path,
        progress: {
          completed: completedCount,
          total: totalItems,
          percentage: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
        },
      }
    })
  )

  // Get themed collections
  const themedCollections = createThemedCollections(userCompletedIds)

  // Get module collections
  const moduleCollections = getModuleCollections(3)

  // Featured learning paths (first 5)
  const featuredPaths = pathsWithProgress.slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover</h1>
        <p className="text-lg text-gray-600">
          Explore curated learning paths and themed collections tailored to your interests
        </p>
      </div>

      {/* Featured Learning Paths */}
      {featuredPaths.length > 0 && (
        <ContentShelf
          title="Featured Learning Paths"
          subtitle="Curated collections designed to solve specific challenges"
          emptyMessage="No learning paths available at this time"
        >
          {featuredPaths.map((path) => (
            <LearningPathCard key={path.id} path={path} />
          ))}
        </ContentShelf>
      )}

      {/* Explore by Theme */}
      {themedCollections.length > 0 && (
        <>
          {themedCollections.map((collection) => (
            <ContentShelf
              key={collection.id}
              title={collection.title}
              subtitle={collection.subtitle}
              emptyMessage={`No items available in ${collection.title} at this time`}
              viewAllHref={collection.viewAllHref}
            >
              {collection.items.map((item) => {
                if (item.type === 'lesson') {
                  return (
                    <LessonCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      url={item.url}
                      moduleTitle={item.moduleTitle}
                      domainTitle={item.domainTitle}
                      shelfName={collection.title}
                    />
                  )
                }
                return (
                  <CaseCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    url={item.url}
                    shelfName={collection.title}
                  />
                )
              })}
            </ContentShelf>
          ))}
        </>
      )}

      {/* Domain Introductions */}
      {moduleCollections.length > 0 && (
        <>
          {moduleCollections.map((collection) => (
            <ContentShelf
              key={collection.id}
              title={collection.title}
              subtitle={collection.subtitle}
              emptyMessage={`No items available in ${collection.title} at this time`}
              viewAllHref={collection.viewAllHref}
            >
              {collection.items.map((item) => {
                if (item.type === 'lesson') {
                  return (
                    <LessonCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      url={item.url}
                      moduleTitle={item.moduleTitle}
                      domainTitle={item.domainTitle}
                      shelfName={collection.title}
                    />
                  )
                }
                return (
                  <CaseCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    url={item.url}
                    shelfName={collection.title}
                  />
                )
              })}
            </ContentShelf>
          ))}
        </>
      )}

      {/* All Learning Paths */}
      {pathsWithProgress.length > featuredPaths.length && (
        <ContentShelf
          title="All Learning Paths"
          subtitle="Browse all available curated paths"
          emptyMessage="No additional learning paths available"
        >
          {pathsWithProgress.slice(featuredPaths.length).map((path) => (
            <LearningPathCard key={path.id} path={path} />
          ))}
        </ContentShelf>
      )}
    </div>
  )
}

