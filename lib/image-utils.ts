/**
 * Image utility functions for generating content images
 * Uses Unsplash Source (free, no API key required)
 */

export function getContentImageUrl(
  title: string,
  width: number = 400,
  height: number = 400,
  type?: 'lesson' | 'case' | 'thread'
): string {
  // Extract keywords from title for relevant images
  const keywords = extractKeywords(title, type)
  // Use Unsplash Source API (no key required) - format: /WIDTHxHEIGHT/?KEYWORDS
  const query = keywords.join(',')
  return `https://source.unsplash.com/${width}x${height}/?${query}`
}

function extractKeywords(title: string, type?: 'lesson' | 'case' | 'thread'): string[] {
  const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  
  // Add type-specific keywords
  const typeKeywords: Record<string, string[]> = {
    lesson: ['business', 'education', 'professional', 'office'],
    case: ['business', 'strategy', 'meeting', 'corporate'],
    thread: ['discussion', 'team', 'collaboration', 'network']
  }
  
  const keywords = [...words.slice(0, 2)]
  if (type && typeKeywords[type]) {
    keywords.push(...typeKeywords[type].slice(0, 1))
  }
  
  // Fallback to professional keywords
  if (keywords.length === 0) {
    keywords.push('business', 'professional')
  }
  
  return keywords.slice(0, 3)
}

/**
 * Get a consistent image URL for a given content ID (for caching)
 */
export function getContentImageUrlById(
  contentId: string,
  width: number = 400,
  height: number = 400
): string {
  // Use a hash of the ID to get consistent images
  const seed = contentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const categories = ['business', 'office', 'professional', 'corporate', 'strategy', 'team']
  const category = categories[seed % categories.length]
  return `https://source.unsplash.com/${width}x${height}/?${category}&sig=${seed}`
}

