'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MarkdownCheatSheet() {
  const examples = [
    {
      name: 'Headers',
      syntax: '# H1\n## H2\n### H3\n#### H4',
      description: 'Create different heading levels',
    },
    {
      name: 'Bold & Italic',
      syntax: '**bold text**\n*italic text*',
      description: 'Emphasize text',
    },
    {
      name: 'Lists',
      syntax: '- Item 1\n- Item 2\n\n1. First\n2. Second',
      description: 'Unordered and ordered lists',
    },
    {
      name: 'Links',
      syntax: '[Link text](https://example.com)',
      description: 'Create clickable links',
    },
    {
      name: 'Code',
      syntax: '`inline code`\n\n```\ncode block\n```',
      description: 'Display code snippets',
    },
    {
      name: 'Blockquote',
      syntax: '> This is a quote',
      description: 'Quote text',
    },
    {
      name: 'Horizontal Rule',
      syntax: '---',
      description: 'Add a divider',
    },
    {
      name: 'Images',
      syntax: '![Alt text](image-url)',
      description: 'Embed images',
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Markdown Cheat Sheet</CardTitle>
          <CardDescription>Quick reference for markdown syntax</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((example) => (
              <div key={example.name} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-1">{example.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{example.description}</p>
                <pre className="bg-gray-50 p-2 rounded text-xs font-mono overflow-x-auto">
                  {example.syntax}
                </pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

