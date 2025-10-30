/**
 * Utility functions for markdown processing
 */

/**
 * Strips markdown syntax and returns plain text excerpt
 * Handles headings, lists, code blocks, links, bold, italic, etc.
 */
export function stripMarkdown(markdown: string): string {
  let text = markdown

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '')
  text = text.replace(/`[^`]*`/g, '')

  // Remove headings but keep the text
  text = text.replace(/#{1,6}\s+/g, '')

  // Remove links but keep the text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')

  // Remove bold and italic
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')

  // Remove list markers
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')

  // Remove blockquotes
  text = text.replace(/^\s*>\s+/gm, '')

  // Remove horizontal rules
  text = text.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '')

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Collapse multiple spaces and newlines
  text = text.replace(/\n\s*\n/g, '\n')
  text = text.replace(/[ \t]+/g, ' ')

  // Trim
  text = text.trim()

  return text
}

/**
 * Extracts the first meaningful paragraph from markdown content
 * Skips frontmatter, headings, and empty lines
 */
export function getFirstParagraph(markdown: string): string {
  const lines = markdown.split('\n')
  let inFrontmatter = false
  let inCodeBlock = false
  let paragraph = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip frontmatter
    if (line === '---') {
      if (i === 0) {
        inFrontmatter = true
        continue
      } else if (inFrontmatter) {
        inFrontmatter = false
        continue
      }
    }

    if (inFrontmatter) continue

    // Skip code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) continue

    // Skip headings
    if (line.startsWith('#')) continue

    // Skip empty lines
    if (line === '') continue

    // Skip list items (we want prose)
    if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) continue

    // Found a paragraph
    paragraph = line
    break
  }

  return stripMarkdown(paragraph)
}

/**
 * Creates a text excerpt from markdown content
 */
export function createExcerpt(markdown: string, maxLength: number = 150): string {
  const firstPara = getFirstParagraph(markdown)
  
  if (firstPara.length <= maxLength) {
    return firstPara
  }

  // Truncate at word boundary
  const truncated = firstPara.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...'
  }

  return truncated + '...'
}

/**
 * Calculate estimated reading time in minutes
 */
export function calculateReadingTime(markdown: string): number {
  const plainText = stripMarkdown(markdown)
  const words = plainText.split(/\s+/).length
  const wordsPerMinute = 200
  const minutes = Math.ceil(words / wordsPerMinute)
  return Math.max(1, minutes)
}

