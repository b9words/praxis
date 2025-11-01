import CurriculumGenerator from '@/components/admin/CurriculumGenerator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminGeneratePage() {
  try {
    await requireRole(['admin', 'editor'])
  } catch {
    redirect('/dashboard')
  }

  // Fetch competencies for Capital Allocation
  const competencies = await prisma.competency.findMany({
    where: {
      name: {
        contains: 'capital',
        mode: 'insensitive',
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Curriculum Generator</h1>
            <p className="text-sm text-gray-600">Generate comprehensive curriculum content using AI</p>
          </div>
          <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
            <Link href="/admin/content">Back to Content</Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-base font-medium text-gray-900 mb-2">Capital Allocation Curriculum</h3>
          <p className="text-xs text-gray-500 mb-4">Complete 12-module program</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Modules</span>
              <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">12</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total Lessons</span>
              <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">30</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Est. Content</span>
              <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">~180 pages</Badge>
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

      {/* Main Generator Component */}
      <CurriculumGenerator competencies={competencies} />
    </div>
  )
}
