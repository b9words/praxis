/**
 * Search and filter utilities for library content
 */

/**
 * Performs client-side search on articles
 */
export function searchArticles<T extends { id: string; title: string; content: string; competency?: any }>(
  articles: T[],
  query: string
): T[] {
  if (!query || query.trim() === '') {
    return articles
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/)

  return articles.filter((article) => {
    const competency = Array.isArray(article.competency) ? article.competency[0] : article.competency
    const searchableText = [
      article.title,
      article.content,
      competency?.name || '',
    ]
      .join(' ')
      .toLowerCase()

    return searchTerms.every((term) => searchableText.includes(term))
  })
}

/**
 * Sort articles based on criteria
 */
export function sortArticles<T extends { title: string; created_at?: string }>(
  articles: T[],
  sortBy: 'newest' | 'oldest' | 'title'
): T[] {
  const sorted = [...articles]

  switch (sortBy) {
    case 'newest':
      // Assuming articles are already ordered by created_at DESC from DB
      return sorted.reverse()
    case 'oldest':
      return sorted
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return sorted
  }
}

/**
 * Filter articles by progress status
 */
export function filterByProgress<T extends { id: string }>(
  articles: T[],
  progressMap: Map<string, 'completed' | 'in_progress'>,
  status: 'all' | 'completed' | 'not-started' | 'in-progress'
): T[] {
  if (status === 'all') {
    return articles
  }

  return articles.filter((article) => {
    const articleProgress = progressMap.get(article.id)

    if (status === 'not-started') {
      return !articleProgress
    }

    return articleProgress === status
  })
}

