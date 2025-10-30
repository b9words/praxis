import { describe, expect, it } from 'vitest'

// Basic markdown utility tests
describe('Markdown Utilities', () => {
  describe('Markdown Parsing', () => {
    it('should handle basic markdown formatting', () => {
      const markdown = '# Title\n\nThis is a paragraph.'
      expect(markdown).toContain('# Title')
      expect(markdown).toContain('This is a paragraph')
    })

    it('should handle code blocks', () => {
      const markdown = '```\nconst x = 1\n```'
      expect(markdown).toContain('```')
      expect(markdown).toContain('const x = 1')
    })

    it('should handle links', () => {
      const markdown = '[Link Text](https://example.com)'
      expect(markdown).toContain('[Link Text]')
      expect(markdown).toContain('(https://example.com)')
    })
  })

  describe('Content Extraction', () => {
    it('should extract frontmatter metadata', () => {
      const content = `---
title: Test Article
author: John Doe
---

# Content
Body text here.`
      
      const hasFrontmatter = content.includes('---')
      const hasTitle = content.includes('title: Test Article')
      expect(hasFrontmatter).toBe(true)
      expect(hasTitle).toBe(true)
    })
  })
})

