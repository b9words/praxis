import { prisma } from '@/lib/prisma/server'
import { fetchFromStorageServer } from '@/lib/supabase/storage'
import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params

    // First try to get from database
    const caseItem = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        competencies: {
          include: {
            competency: true,
          },
        },
      },
    })

    if (caseItem && caseItem.storagePath) {
      // Fetch from storage
      const { success, content } = await fetchFromStorageServer(caseItem.storagePath)
      if (success && content) {
        try {
          return NextResponse.json({
            ...caseItem,
            caseData: JSON.parse(content),
          })
        } catch (parseError) {
          console.error('Failed to parse case data JSON:', parseError)
          // Fall through to return caseItem without caseData
        }
      }
    }

    if (caseItem) {
      return NextResponse.json(caseItem)
    }

    // Fallback to local file system
    const filePath = path.join(process.cwd(), 'data', 'case-studies', `${caseId}.json`)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 })
    }

    const fileContents = fs.readFileSync(filePath, 'utf8')
    try {
      const caseStudyData = JSON.parse(fileContents)
      return NextResponse.json(caseStudyData)
    } catch (parseError) {
      console.error('Failed to parse case study JSON file:', parseError)
      return NextResponse.json(
        { error: 'Invalid case study file format' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error loading case study:', error)
    return NextResponse.json({ error: 'Failed to load case study' }, { status: 500 })
  }
}
