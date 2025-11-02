/**
 * Thumbnail Generation Utilities
 * Helper functions for mapping data, fetching icons, and loading fonts
 */

import { COMPETENCY_TO_DOMAIN_MAP, getDisplayNameForCompetency } from './competency-mapping'
import { icons } from './design-tokens'

/**
 * Lucide icon SVG paths - mapping icon names to their SVG path data
 * These are the actual path elements from lucide-react icons
 */
const LUCIDE_ICON_PATHS: Record<string, string> = {
  DollarSign: `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />`,
  Target: `<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />`,
  TrendingUp: `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />`,
  Shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`,
  Users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />`,
  BookOpen: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />`,
  BarChart3: `<path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />`,
}

/**
 * Get domain information from an article's competency
 */
export async function getDomainFromArticle(articleId: string, supabase: any): Promise<{
  domainName: string
  iconName: string
} | null> {
  try {
    // Fetch article with competency
    const { data: article, error } = await supabase
      .from('articles')
      .select('competency:competencies(name)')
      .eq('id', articleId)
      .single()

    if (error || !article?.competency) {
      console.error('Error fetching article:', error)
      return null
    }

    const competencyName = article.competency.name

    // Map competency to domain
    const competencyKey = Object.keys(COMPETENCY_TO_DOMAIN_MAP).find(
      key => getDisplayNameForCompetency(key) === competencyName
    ) || Object.keys(COMPETENCY_TO_DOMAIN_MAP).find(
      key => key.toLowerCase().replace(/\s+/g, '') === competencyName.toLowerCase().replace(/\s+/g, '')
    )

    if (!competencyKey) {
      console.error('No domain mapping found for competency:', competencyName)
      return null
    }

    const domainInfo = COMPETENCY_TO_DOMAIN_MAP[competencyKey]
    const domainName = domainInfo.displayName

    // Map competency to icon name
    let iconName = 'BookOpen' // default
    if (competencyKey.toLowerCase().includes('financial')) {
      iconName = icons.competencies.financial
    } else if (competencyKey.toLowerCase().includes('strategic')) {
      iconName = icons.competencies.strategic
    } else if (competencyKey.toLowerCase().includes('market')) {
      iconName = icons.competencies.market
    } else if (competencyKey.toLowerCase().includes('risk')) {
      iconName = icons.competencies.risk
    } else if (competencyKey.toLowerCase().includes('leadership')) {
      iconName = icons.competencies.leadership
    }

    return { domainName, iconName }
  } catch (error) {
    console.error('Error in getDomainFromArticle:', error)
    return null
  }
}

/**
 * Get domain information from a case study's competencies
 */
export async function getDomainFromCase(caseId: string, supabase: any): Promise<{
  domainName: string
  competencyName: string
} | null> {
  try {
    // Fetch case with competencies
    const { data: caseData, error } = await supabase
      .from('cases')
      .select(`
        competencies:case_competencies(
          competency:competencies(name)
        )
      `)
      .eq('id', caseId)
      .single()

    if (error || !caseData?.competencies || caseData.competencies.length === 0) {
      console.error('Error fetching case:', error)
      return null
    }

    // Use the first competency
    const competencyName = caseData.competencies[0]?.competency?.name

    if (!competencyName) {
      console.error('No competency found for case')
      return null
    }

    // Map competency to domain
    const competencyKey = Object.keys(COMPETENCY_TO_DOMAIN_MAP).find(
      key => getDisplayNameForCompetency(key) === competencyName
    ) || Object.keys(COMPETENCY_TO_DOMAIN_MAP).find(
      key => key.toLowerCase().replace(/\s+/g, '') === competencyName.toLowerCase().replace(/\s+/g, '')
    )

    if (!competencyKey) {
      console.error('No domain mapping found for competency:', competencyName)
      return null
    }

    const domainInfo = COMPETENCY_TO_DOMAIN_MAP[competencyKey]
    const domainName = domainInfo.displayName

    return { domainName, competencyName }
  } catch (error) {
    console.error('Error in getDomainFromCase:', error)
    return null
  }
}

/**
 * Get Lucide icon SVG path data
 */
export function getLucideIconPath(iconName: string): string {
  return LUCIDE_ICON_PATHS[iconName] || LUCIDE_ICON_PATHS.BookOpen
}

/**
 * Load Inter font data from Google Fonts
 */
export async function getFontData(weight: 400 | 500 | 700 = 400): Promise<ArrayBuffer> {
  const weightMap: Record<number, string> = {
    400: 'regular',
    500: 'medium',
    700: 'bold',
  }

  const fontFileName = `Inter-${weightMap[weight] === 'regular' ? 'Regular' : weightMap[weight].charAt(0).toUpperCase() + weightMap[weight].slice(1)}.ttf`
  
  // Use Google Fonts API to get the font file
  // For production, you might want to host these fonts yourself or use a CDN
  const fontUrl = `https://fonts.gstatic.com/s/inter/v18/${weight === 400 ? 'UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' : weight === 500 ? 'UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' : 'UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'}`
  
  try {
    // Fetch from a reliable CDN that hosts Inter
    // Using jsDelivr CDN for Inter fonts
    const cdnUrl = `https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-${weightMap[weight]}-latin.woff2`
    
    const response = await fetch(cdnUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`)
    }
    
    return await response.arrayBuffer()
  } catch (error) {
    console.error('Error loading font, trying alternative:', error)
    
    // Fallback: try Google Fonts directly
    try {
      // Google Fonts uses woff2, but we need to convert or use a different approach
      // For now, we'll use a direct CDN link to TTF files
      const fallbackUrl = `https://github.com/rsms/inter/raw/master/docs/font-files/Inter-${weightMap[weight] === 'regular' ? 'Regular' : weightMap[weight].charAt(0).toUpperCase() + weightMap[weight].slice(1)}.ttf`
      const response = await fetch(fallbackUrl)
      if (!response.ok) {
        throw new Error(`Fallback font fetch failed: ${response.statusText}`)
      }
      return await response.arrayBuffer()
    } catch (fallbackError) {
      console.error('All font loading attempts failed:', fallbackError)
      throw new Error('Unable to load Inter font')
    }
  }
}

/**
 * Extract metadata from article/case for thumbnail generation
 */
export function extractThumbnailMetadata(metadata: any): {
  duration: string
  difficulty: string
} {
  const duration = metadata?.duration || metadata?.estimatedMinutes
    ? `${metadata.estimatedMinutes || metadata.duration} min${metadata.type === 'case' ? ' sim' : ' read'}`
    : metadata?.type === 'case' ? '90 min sim' : '12 min read'

  const difficulty = metadata?.difficulty || 'Advanced'

  return { duration, difficulty }
}

/**
 * Map competency name to icon name
 */
export function getIconForCompetency(competencyName: string): string {
  const lower = competencyName.toLowerCase()
  if (lower.includes('financial')) return 'DollarSign'
  if (lower.includes('strategic')) return 'Target'
  if (lower.includes('market')) return 'TrendingUp'
  if (lower.includes('risk')) return 'Shield'
  if (lower.includes('leadership')) return 'Users'
  return 'BookOpen'
}

