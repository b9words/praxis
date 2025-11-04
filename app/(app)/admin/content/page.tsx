import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ContentManagementEnhanced from '@/components/admin/ContentManagementEnhanced'
import CurriculumGenerator from '@/components/admin/CurriculumGenerator'
import CaseBlueprintsPanel from '@/components/admin/CaseBlueprintsPanel'
import CaseAssetsManager from '@/components/admin/CaseAssetsManager'
import LearningPathsManager from '@/components/admin/LearningPathsManager'
import { prisma } from '@/lib/prisma/server'
import Link from 'next/link'

export default async function AdminContentPage() {
  const { cache, CacheTags } = await import('@/lib/cache')
  
  const getCachedContent = cache(
    async () => {
      const [articles, cases] = await Promise.all([
        prisma.article.findMany({
          include: {
            competency: { select: { name: true } },
            creator: { select: { username: true } },
            updater: { select: { username: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.case.findMany({
          include: {
            creator: { select: { username: true } },
            updater: { select: { username: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
      ])
      return { articles, cases }
    },
    ['admin', 'content'],
    { tags: [CacheTags.ARTICLES, CacheTags.CASES], revalidate: 60 }
  )
  
  const { articles, cases } = await getCachedContent()
  const statusGroups = ['draft', 'in_review', 'approved', 'published']
  const groupByStatus = (status: string) => ({
    articles: articles.filter(a => a.status === status),
    cases: cases.filter(c => c.status === status)
  })

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Content</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/content/new?type=article">New Article</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/content/new?type=case">New Case</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="generate-lessons">Generate Lessons</TabsTrigger>
          <TabsTrigger value="generate-cases">Generate Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-4">
          <ContentManagementEnhanced
            articles={articles.map((a: any) => ({
              id: a.id,
              type: 'article' as const,
              title: a.title,
              status: a.status,
              updatedAt: a.updatedAt,
              competency: a.competency,
              storagePath: a.storagePath,
              content: a.content || undefined,
              creator: a.creator || undefined,
              updater: a.updater || undefined,
            }))}
            cases={[]}
          />
        </TabsContent>

        <TabsContent value="cases" className="mt-4">
          <ContentManagementEnhanced
            articles={[]}
            cases={cases.map((c: any) => ({
              id: c.id,
              type: 'case' as const,
              title: c.title,
              status: c.status,
              updatedAt: c.updatedAt,
              storagePath: c.storagePath,
              briefingDoc: c.briefingDoc || undefined,
              creator: c.creator || undefined,
              updater: c.updater || undefined,
            }))}
          />
        </TabsContent>

        <TabsContent value="paths" className="mt-4">
          <LearningPathsManager />
        </TabsContent>

        <TabsContent value="generate-lessons" className="mt-4">
          <CurriculumGenerator />
        </TabsContent>

        <TabsContent value="generate-cases" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CaseBlueprintsPanel />
            <CaseAssetsManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
