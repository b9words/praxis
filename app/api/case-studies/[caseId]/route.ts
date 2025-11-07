import { getCurrentUser } from '@/lib/auth/get-user'
import { requireRole } from '@/lib/auth/authorize'
import { getCaseByIdWithCompetencies, listCaseFiles } from '@/lib/db/cases'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params
    const user = await getCurrentUser()

    // First try to get from database
    const caseItem = await getCaseByIdWithCompetencies(caseId)

    // Check access permissions
    if (caseItem) {
      // If case is not published, require authentication and editor/admin role
      if (!caseItem.published) {
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // Check if user is editor or admin
        try {
          await requireRole(['editor', 'admin'])
        } catch {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      // For published cases, authentication is optional (public access allowed)
    }

    if (caseItem) {
      // Cases are now stored in DB - include files if needed
      const files = await listCaseFiles(caseId)
      
      // Build caseData structure with files
      const caseData: any = {
        title: caseItem.title,
        description: caseItem.description,
        briefing: caseItem.briefingDoc ? { overview: caseItem.briefingDoc } : null,
        datasets: caseItem.datasets,
        rubric: caseItem.rubric,
        competencies: (caseItem.metadata as any)?.competencies || [],
        persona: (caseItem.metadata as any)?.persona || {},
        caseFiles: files.map(f => ({
          fileId: f.fileId,
          fileName: f.fileName,
          fileType: f.fileType,
          source: f.content ? { type: 'STATIC', content: f.content } : { type: 'REFERENCE', path: null },
        })),
        metadata: caseItem.metadata || {},
      }
      
      return NextResponse.json({
        ...caseItem,
        caseData,
      })
    }
    
    return NextResponse.json({ error: 'Case study not found' }, { status: 404 })
  } catch (error) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error loading case study:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}
