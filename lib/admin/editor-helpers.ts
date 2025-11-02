/**
 * Helper utilities for admin editors
 */

export interface EditorStats {
  wordCount: number
  characterCount: number
  lineCount: number
}

export function calculateStats(content: string): EditorStats {
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(word => word.length > 0).length : 0
  const characterCount = content.length
  const lineCount = content.split('\n').length

  return {
    wordCount,
    characterCount,
    lineCount,
  }
}

export function normalizePastedText(text: string): string {
  // Remove formatting, normalize line breaks
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .trim()
}

export interface MarkdownLintError {
  line: number
  column?: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

export function lintMarkdown(content: string): MarkdownLintError[] {
  const errors: MarkdownLintError[] = []
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Check for trailing spaces
    if (line.endsWith(' ') && line.trim().length > 0) {
      errors.push({
        line: lineNum,
        message: 'Trailing whitespace',
        severity: 'warning',
      })
    }

    // Check for very long lines (potential formatting issues)
    if (line.length > 120 && !line.trim().startsWith('```')) {
      errors.push({
        line: lineNum,
        message: 'Line exceeds 120 characters (consider wrapping)',
        severity: 'info',
      })
    }

    // Check for heading level jumps (h1 -> h3 without h2)
    if (line.match(/^###\s/) && index > 0) {
      const prevLine = lines[index - 1]
      if (!prevLine.match(/^##\s/)) {
        const prevHeading = prevLine.match(/^#+\s/)
        if (prevHeading && prevHeading[0].length === 2) {
          // Previous was h1, current is h3
          errors.push({
            line: lineNum,
            message: 'Skipping heading level (h1 -> h3). Consider using h2 first.',
            severity: 'warning',
          })
        }
      }
    }
  })

  return errors
}

export const MARKDOWN_SHORTCUTS = {
  bold: { key: 'Cmd+B', description: 'Bold text' },
  italic: { key: 'Cmd+I', description: 'Italic text' },
  heading1: { key: 'Cmd+1', description: 'Heading 1' },
  heading2: { key: 'Cmd+2', description: 'Heading 2' },
  heading3: { key: 'Cmd+3', description: 'Heading 3' },
  code: { key: 'Cmd+`', description: 'Inline code' },
  codeBlock: { key: 'Cmd+Shift+`', description: 'Code block' },
  link: { key: 'Cmd+K', description: 'Insert link' },
  save: { key: 'Cmd+S', description: 'Save' },
  undo: { key: 'Cmd+Z', description: 'Undo' },
  redo: { key: 'Cmd+Shift+Z', description: 'Redo' },
}

export function formatMarkdownToolbarAction(
  action: string,
  selectedText: string,
  cursorPosition: { line: number; ch: number },
  fullContent: string
): { text: string; cursorOffset: number } {
  const lines = fullContent.split('\n')
  const currentLine = lines[cursorPosition.line] || ''

  switch (action) {
    case 'bold':
      if (selectedText) {
        return { text: `**${selectedText}**`, cursorOffset: selectedText.length + 4 }
      }
      return { text: '****', cursorOffset: 2 }

    case 'italic':
      if (selectedText) {
        return { text: `*${selectedText}*`, cursorOffset: selectedText.length + 2 }
      }
      return { text: '**', cursorOffset: 1 }

    case 'heading1':
      if (selectedText) {
        return { text: `# ${selectedText}`, cursorOffset: selectedText.length + 2 }
      }
      return { text: '# ', cursorOffset: 2 }

    case 'heading2':
      if (selectedText) {
        return { text: `## ${selectedText}`, cursorOffset: selectedText.length + 3 }
      }
      return { text: '## ', cursorOffset: 3 }

    case 'heading3':
      if (selectedText) {
        return { text: `### ${selectedText}`, cursorOffset: selectedText.length + 4 }
      }
      return { text: '### ', cursorOffset: 4 }

    case 'code':
      if (selectedText) {
        return { text: `\`${selectedText}\``, cursorOffset: selectedText.length + 2 }
      }
      return { text: '``', cursorOffset: 1 }

    case 'codeBlock':
      if (selectedText) {
        return { text: `\`\`\`\n${selectedText}\n\`\`\``, cursorOffset: selectedText.length + 7 }
      }
      return { text: '```\n\n```', cursorOffset: 5 }

    case 'link':
      if (selectedText) {
        return { text: `[${selectedText}](url)`, cursorOffset: selectedText.length + 7 }
      }
      return { text: '[](url)', cursorOffset: 2 }

    case 'unorderedList':
      if (currentLine.trim()) {
        return { text: `- ${currentLine}`, cursorOffset: 2 }
      }
      return { text: '- ', cursorOffset: 2 }

    case 'orderedList':
      if (currentLine.trim()) {
        return { text: `1. ${currentLine}`, cursorOffset: 4 }
      }
      return { text: '1. ', cursorOffset: 3 }

    default:
      return { text: '', cursorOffset: 0 }
  }
}

