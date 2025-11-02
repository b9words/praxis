import { Button } from '@/components/ui/button'
import { completeCurriculumData, getCurriculumStats } from '@/lib/curriculum-data'
import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
import { BookOpen, ChevronRight, Clock, Target, Users } from 'lucide-react'
import Link from 'next/link'

export default async function CurriculumLibraryPage() {
  // Cache curriculum structure (24h revalidate)
  const getCachedCurriculumData = cache(
    async () => {
      // Try to load curriculum structure from database with error handling
      let articlesFromDb: any[] = []
      try {
        // First try with enum value (if enum exists in DB)
        articlesFromDb = await prisma.article.findMany({
          where: {
            status: 'published',
            storagePath: {
              not: null,
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
            articlesFromDb = await prisma.article.findMany({
              where: {
                storagePath: {
                  not: null,
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
            console.error('Error fetching articles from database:', fallbackError)
          }
        } else {
          console.error('Error fetching articles from database:', error)
        }
      }

      // Build curriculum structure from database articles if available
      let curriculumData = completeCurriculumData
      let useDbData = false

      if (articlesFromDb.length > 0) {
    // Group articles by domain from metadata
    const domainMap = new Map()

    articlesFromDb.forEach((article) => {
      const metadata = (article.metadata as any) || {}
      const domain = metadata.domain || 'uncategorized'
      const module = metadata.module || 'uncategorized'

      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          id: domain,
          title: metadata.domainTitle || domain,
          philosophy: metadata.domainPhilosophy || '',
          modules: new Map(),
        })
      }

      const domainData = domainMap.get(domain)
      if (!domainData.modules.has(module)) {
        domainData.modules.set(module, {
          id: module,
          number: metadata.moduleNumber || 1,
          title: metadata.moduleTitle || module,
          lessons: [],
        })
      }

      const moduleData = domainData.modules.get(module)
      moduleData.lessons.push({
        id: article.storagePath?.split('/').pop()?.replace('.md', '') || article.id,
        number: metadata.lesson_number || 1,
        title: article.title,
        description: article.description || '',
      })
    })

        // Convert to array and sort
        if (domainMap.size > 0) {
          curriculumData = Array.from(domainMap.values()).map((domain) => ({
            ...domain,
            modules: Array.from(domain.modules.values()).sort((a: any, b: any) => a.number - b.number),
          }))
          useDbData = true
        }
      }

      const stats = useDbData
        ? {
            totalDomains: curriculumData.length,
            totalModules: curriculumData.reduce((sum, d) => sum + d.modules.length, 0),
            totalLessons: curriculumData.reduce(
              (sum, d) => sum + d.modules.reduce((mSum: number, m: any) => mSum + m.lessons.length, 0),
              0
            ),
          }
        : getCurriculumStats()

      return { curriculumData, stats }
    },
    ['library', 'curriculum', 'structure'],
    {
      tags: [CacheTags.CURRICULUM],
      revalidate: 86400, // 24 hours
    }
  )

  const { curriculumData, stats } = await getCachedCurriculumData()

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4 md:px-6 md:py-6 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-xl font-semibold leading-tight text-neutral-900">
              Executive Education Curriculum
            </h1>
            <p className="text-sm text-neutral-500 leading-snug max-w-3xl">
              A comprehensive curriculum for developing world-class CEOs and senior executives.
              Master the 10 critical domains that define exceptional leadership.
            </p>

            {/* Stats */}
            <div className="flex gap-6 mt-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">{stats.totalDomains}</div>
                <div className="text-xs text-neutral-500">Domains</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">{stats.totalModules}</div>
                <div className="text-xs text-neutral-500">Modules</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">{stats.totalLessons}</div>
                <div className="text-xs text-neutral-500">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-900">
                  {Math.round((stats.totalLessons * 12) / 60)}
                </div>
                <div className="text-xs text-neutral-500">Hours</div>
              </div>
            </div>
          </div>

          {/* Domain Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {curriculumData.map((domain, index) => (
              <div
                key={domain.id}
                className="bg-neutral-50 border border-neutral-200 group hover:border-neutral-300 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-medium leading-tight text-neutral-900 mb-2">
                        {domain.title}
                      </h3>
                      <p className="text-sm text-neutral-600 leading-snug">
                        {domain.philosophy.length > 200
                          ? `${domain.philosophy.substring(0, 200)}...`
                          : domain.philosophy}
                      </p>
                    </div>
                    <div className="ml-3 text-xs text-neutral-400 font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>{domain.modules.length} modules</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>
                          {domain.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {domain.modules.reduce((sum, m) => sum + m.lessons.length, 0) * 12} min
                        </span>
                      </div>
                    </div>

                    {/* Sample Modules */}
                    {domain.modules.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-700">Key Modules:</div>
                        <div className="space-y-1">
                          {domain.modules.slice(0, 3).map((module) => (
                            <div key={module.id} className="text-xs text-gray-600 flex items-center gap-2">
                              <ChevronRight className="h-3 w-3 text-gray-400" />
                              <span className="font-medium">Module {module.number}:</span>
                              <span>{module.title}</span>
                            </div>
                          ))}
                          {domain.modules.length > 3 && (
                            <div className="text-xs text-gray-500 ml-5">
                              +{domain.modules.length - 3} more modules
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none">
                        <Link href={`/library/curriculum/${domain.id}`}>
                          Explore Domain
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Learning Path Recommendations */}
          <div className="bg-gray-50 border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <Users className="h-10 w-10 text-gray-400 mx-auto" />
              <h2 className="text-xl font-medium text-gray-900">Structured Learning Paths</h2>
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                Follow our curated learning paths designed for different executive roles and experience levels. Each path combines multiple domains for comprehensive skill development.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
                  <Link href="/residency">View Learning Paths</Link>
                </Button>
                <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
                  <Link href="/admin/content/generate">Generate Content</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 text-center p-6">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">Browse All Articles</h3>
              <p className="text-xs text-gray-600 mb-4">Access traditional article-based learning</p>
              <Button asChild variant="outline" size="sm" className="border-gray-300 hover:border-gray-400 rounded-none">
                <Link href="/library">View Articles</Link>
              </Button>
            </div>

            <div className="bg-white border border-gray-200 text-center p-6">
              <Target className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">Track Progress</h3>
              <p className="text-xs text-gray-600 mb-4">Monitor your learning journey</p>
              <Button asChild variant="outline" size="sm" className="border-gray-300 hover:border-gray-400 rounded-none">
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </div>

            <div className="bg-white border border-gray-200 text-center p-6">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">Join Community</h3>
              <p className="text-xs text-gray-600 mb-4">Connect with fellow executives</p>
              <Button asChild variant="outline" size="sm" className="border-gray-300 hover:border-gray-400 rounded-none">
                <Link href="/community">Join Discussion</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
