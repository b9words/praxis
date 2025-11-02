import CurriculumGenerator from '@/components/admin/CurriculumGenerator'
import CaseStudyGenerator from '@/components/admin/CaseStudyGenerator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { prisma } from '@/lib/prisma/server'
import { getAllLessonsFlat, completeCurriculumData, getCurriculumStats } from '@/lib/curriculum-data'
import Link from 'next/link'

export default async function AdminGeneratePage() {
  // Competencies are no longer needed - they're resolved from lesson metadata
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Content Generator</h1>
            <p className="text-sm text-gray-600">Generate curriculum lessons and case studies using AI</p>
          </div>
          <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
            <Link href="/admin/content">Back to Content</Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-900 mb-2">Complete Curriculum</h3>
          <p className="text-xs text-gray-500 mb-4">All domains available for generation</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Domains</span>
              <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                {completeCurriculumData.length}
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total Lessons</span>
              <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                {getAllLessonsFlat().length}
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Est. Content</span>
              <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                ~{Math.round(getAllLessonsFlat().length * 2.5)} pages
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-900 mb-2">AI Features</h3>
          <p className="text-xs text-gray-500 mb-4">Advanced content generation</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Mermaid Diagrams</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Data Tables</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Case Studies</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Calculations</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-900 mb-2">Pro Models Only</h3>
          <p className="text-xs text-gray-500 mb-4">High-quality generation</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>GPT-4o</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>GPT-4 Turbo</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <span>Gemini 1.5 Pro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generator Tabs */}
      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lessons">Generate Lessons</TabsTrigger>
          <TabsTrigger value="cases">Generate Case Studies</TabsTrigger>
        </TabsList>
        <TabsContent value="lessons" className="mt-6">
          <CurriculumGenerator />
        </TabsContent>
        <TabsContent value="cases" className="mt-6">
          <CaseStudyGenerator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
