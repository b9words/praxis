import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

/**
 * GET /api/case-taxonomy
 * Serve the case study taxonomy (arenas, competencies, blueprints)
 */
export async function GET() {
  try {
    const taxonomyPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'arenas.json')
    
    if (!fs.existsSync(taxonomyPath)) {
      return NextResponse.json(
        { error: 'Taxonomy not found. Run scripts/convert-case-blueprints.ts first.' },
        { status: 404 }
      )
    }
    
    const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf-8')
    const taxonomy = JSON.parse(taxonomyContent)
    
    // Also include challenge type map
    const mapPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'challenge-type-map.json')
    let challengeTypeMap: Record<string, string> = {}
    
    if (fs.existsSync(mapPath)) {
      const mapContent = fs.readFileSync(mapPath, 'utf-8')
      challengeTypeMap = JSON.parse(mapContent)
    }
    
    // Include framework
    const frameworkPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'framework.json')
    let framework: any = null
    
    if (fs.existsSync(frameworkPath)) {
      const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
      framework = JSON.parse(frameworkContent)
    }
    
    return NextResponse.json({
      arenas: taxonomy.arenas || [],
      challengeTypeMap,
      framework
    })
  } catch (error) {
    console.error('Error loading taxonomy:', error)
    return NextResponse.json(
      { error: 'Failed to load taxonomy' },
      { status: 500 }
    )
  }
}

