import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { buildAssetGenerationPrompt } from '@/lib/case-generation-prompts'
import { generateWithAI, uploadToStorage, isSupabaseAvailable } from '@/scripts/generate-shared'

export const runtime = 'nodejs'

/**
 * POST /api/case-generation/generate-asset
 * Generate or regenerate a single case file asset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      caseId,
      fileId,
      new: isNew,
      type,
      fileName,
      overwrite = false,
    } = body

    if (!caseId || (!fileId && !isNew)) {
      return NextResponse.json(
        { error: 'Missing required: caseId and either fileId or new asset specs' },
        { status: 400 }
      )
    }

    // Load case from storage or data directory
    const casePath = path.join(process.cwd(), 'data', 'case-studies', `${caseId}.json`)
    let caseData: any

    if (fs.existsSync(casePath)) {
      const caseContent = fs.readFileSync(casePath, 'utf-8')
      caseData = JSON.parse(caseContent)
    } else {
      // Try to load from taxonomy to get blueprint info
      const taxonomyPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'arenas.json')
      if (!fs.existsSync(taxonomyPath)) {
        return NextResponse.json(
          { error: 'Case not found and taxonomy unavailable' },
          { status: 404 }
        )
      }
      // For now, return error - would need case lookup logic
      return NextResponse.json(
        { error: 'Case not found. Generate case first.' },
        { status: 404 }
      )
    }

    // Find or create asset entry
    let asset: any
    if (isNew) {
      if (!type || !fileName) {
        return NextResponse.json(
          { error: 'New asset requires type and fileName' },
          { status: 400 }
        )
      }
      
      asset = {
        fileId: fileName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        fileName,
        fileType: type,
        source: { type: 'STATIC', content: '' },
      }
      caseData.caseFiles = caseData.caseFiles || []
      caseData.caseFiles.push(asset)
    } else {
      asset = caseData.caseFiles?.find((f: any) => f.fileId === fileId)
      if (!asset) {
        return NextResponse.json(
          { error: `File ${fileId} not found in case` },
          { status: 404 }
        )
      }

      if (asset.source?.type === 'REFERENCE' && !overwrite) {
        return NextResponse.json(
          { error: 'File is a REFERENCE type. Set overwrite=true to regenerate.' },
          { status: 400 }
        )
      }
    }

    // Find blueprint for context (assume first competency for now)
    const taxonomyPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'arenas.json')
    const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf-8')
    const taxonomy = JSON.parse(taxonomyContent)

    // Try to find matching blueprint
    let blueprint: any = null
    let competency: any = null
    
    for (const arena of taxonomy.arenas) {
      for (const comp of arena.competencies) {
        const match = comp.blueprints.find((b: any) => 
          caseData.title?.includes(b.title) || 
          caseId.includes(b.id)
        )
        if (match) {
          blueprint = match
          competency = comp
          break
        }
      }
      if (blueprint) break
    }

    // Load framework
    const frameworkPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'framework.json')
    const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
    const framework = JSON.parse(frameworkContent)

    // Generate asset content
    const assetPrompt = buildAssetGenerationPrompt(
      asset.fileName.replace(/\.[^.]+$/, ''), // Remove extension for prompt
      asset.fileType as any,
      blueprint || { title: caseData.title || '', dilemma: caseData.description || '', task: '', assets: [] },
      competency || { name: caseData.competencies?.[0] || 'Strategic Thinking', primaryChallengeType: '', secondaryTypes: [], blueprints: [] },
      framework
    )

    const result = await generateWithAI(
      assetPrompt,
      'You are an expert business analyst creating realistic case study materials.',
      { trackUsage: true }
    )

    // Determine file extension and path
    const isCSV = asset.fileType === 'FINANCIAL_DATA'
    const ext = isCSV ? 'csv' : 'md'
    const sourcesDir = path.join(process.cwd(), 'content', 'sources', caseId)
    if (!fs.existsSync(sourcesDir)) {
      fs.mkdirSync(sourcesDir, { recursive: true })
    }

    const filePath = path.join(sourcesDir, asset.fileName.endsWith(ext) ? asset.fileName : `${asset.fileName}.${ext}`)
    const fileName = path.basename(filePath)
    
    // Save file locally
    fs.writeFileSync(filePath, result.content, 'utf-8')

    // Also upload to Supabase Storage if available
    let storagePath: string | null = null
    if (isSupabaseAvailable()) {
      try {
        const contentType = isCSV ? 'text/csv' : 'text/markdown'
        storagePath = `cases/${caseId}/assets/${fileName}`
        await uploadToStorage(storagePath, result.content, contentType)
      } catch (storageError) {
        console.warn('Failed to upload asset to storage:', storageError)
        // Continue with local file only
      }
    }

    // Update case JSON to use REFERENCE
    asset.source = {
      type: 'REFERENCE',
      path: `content/sources/${caseId}/${fileName}`,
    }

    // Save updated case
    fs.writeFileSync(casePath, JSON.stringify(caseData, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      fileId: asset.fileId,
      fileName,
      filePath: asset.source.path,
      storagePath,
      content: result.content.substring(0, 500) + '...', // Preview
    })
  } catch (error) {
    console.error('Error generating asset:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

