import CurriculumGenerator from '@/components/admin/CurriculumGenerator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Curriculum Generator</h1>
          <p className="mt-2 text-gray-600">Generate comprehensive curriculum content using AI</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/content">← Back to Content</Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capital Allocation Curriculum</CardTitle>
            <CardDescription>Complete 12-module program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Modules</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Lessons</span>
                <Badge variant="outline">30</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Est. Content</span>
                <Badge variant="outline">~180 pages</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Features</CardTitle>
            <CardDescription>Advanced content generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Mermaid Diagrams</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Data Tables</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Case Studies</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Calculations</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pro Models Only</CardTitle>
            <CardDescription>High-quality generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>GPT-4o</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>GPT-4 Turbo</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Gemini 1.5 Pro</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Generator Component */}
      <CurriculumGenerator competencies={competencies} />
    </div>
  )
}
