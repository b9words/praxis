'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { foldGutter, foldKeymap, bracketMatching, defaultHighlightStyle } from '@codemirror/language'
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { lintKeymap } from '@codemirror/lint'
import { useHotkeys } from 'react-hotkeys-hook'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownRenderer from '@/components/ui/Markdown'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MarkdownCheatSheet from '@/components/admin/MarkdownCheatSheet'
import { Bold, Code, Heading1, Heading2, Heading3, HelpCircle, Italic, Link, List, ListOrdered, Save } from 'lucide-react'
import { calculateStats, formatMarkdownToolbarAction, lintMarkdown, MARKDOWN_SHORTCUTS, type EditorStats } from '@/lib/admin/editor-helpers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface RichMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  onSave?: () => void
  showPreview?: boolean
  autoSave?: boolean
  onAutoSave?: (content: string) => void
}

export default function RichMarkdownEditor({
  value,
  onChange,
  placeholder = '# Your Article Title\n\nWrite your content here...',
  minHeight = '400px',
  onSave,
  showPreview = true,
  autoSave = false,
  onAutoSave,
}: RichMarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [showSplitView, setShowSplitView] = useState(false)
  const [stats, setStats] = useState<EditorStats>({ wordCount: 0, characterCount: 0, lineCount: 0 })
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    try {
      const extensions = [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        bracketMatching(),
        closeBrackets(),
        autocompletion({
          override: [
            (context: any) => {
              const word = context.matchBefore(/\w*/)
              const options = [
                { label: 'bold', type: 'keyword', apply: '**text**' },
                { label: 'italic', type: 'keyword', apply: '*text*' },
                { label: 'heading1', type: 'keyword', apply: '# Heading' },
                { label: 'heading2', type: 'keyword', apply: '## Heading' },
                { label: 'heading3', type: 'keyword', apply: '### Heading' },
                { label: 'link', type: 'keyword', apply: '[text](url)' },
                { label: 'code', type: 'keyword', apply: '`code`' },
                { label: 'codeBlock', type: 'keyword', apply: '```\ncode\n```' },
                { label: 'list', type: 'keyword', apply: '- Item' },
                { label: 'orderedList', type: 'keyword', apply: '1. Item' },
              ]
              return {
                from: word ? word.from : context.pos,
                options,
              }
            },
          ],
        }),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              if (onSave) {
                onSave()
              }
              return true
            },
          },
        ]),
        markdown(),
        EditorState.tabSize.of(2),
        EditorView.updateListener.of((update: any) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString()
            onChange(newValue)
            setStats(calculateStats(newValue))

            // Auto-save logic
            if (autoSave && onAutoSave) {
              setIsAutoSaving(true)
              if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
              }
              autoSaveTimeoutRef.current = setTimeout(() => {
                onAutoSave(newValue)
                setLastSaved(new Date())
                setIsAutoSaving(false)
              }, 30000) // 30 seconds debounce
            }
          }
        }),
        EditorView.theme({
          '&': {
            fontSize: '14px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          '.cm-content': {
            minHeight,
            padding: '16px',
          },
          '.cm-focused': {
            outline: 'none',
          },
          '.cm-editor': {
            border: '1px solid hsl(var(--border))',
            borderRadius: 'calc(var(--radius) - 2px)',
          },
        }),
      ]

      const state = EditorState.create({
        doc: value,
        extensions,
      })

      const view = new EditorView({
        state,
        parent: editorRef.current,
      })

      viewRef.current = view

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
        if (view) {
          view.destroy()
        }
        viewRef.current = null
      }
    } catch (error) {
      console.error('Error initializing CodeMirror:', error)
      // Fallback: still set viewRef to null so component can attempt to reinitialize
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - don't recreate editor when props change

  // Update editor content when value prop changes (but not from user typing)
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: value },
      })
      viewRef.current.dispatch(transaction)
    }
  }, [value])

  // Update stats when value changes
  useEffect(() => {
    setStats(calculateStats(value))
  }, [value])

  // Keyboard shortcuts
  useHotkeys('mod+s', (e) => {
    e.preventDefault()
    if (onSave) onSave()
  })

  const handleToolbarAction = (action: string) => {
    if (!viewRef.current) return

    const view = viewRef.current
    const state = view.state
    const selection = state.selection.main
    const selectedText = state.sliceDoc(selection.from, selection.to)
    const cursorPosition = state.doc.lineAt(selection.head)
    const fullContent = state.doc.toString()

    const result = formatMarkdownToolbarAction(
      action,
      selectedText,
      { line: cursorPosition.number - 1, ch: selection.head - cursorPosition.from },
      fullContent
    )

    if (selectedText) {
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: result.text },
        selection: { anchor: selection.from + result.cursorOffset },
      })
    } else {
      view.dispatch({
        changes: { from: selection.head, insert: result.text },
        selection: { anchor: selection.head + result.cursorOffset },
      })
    }
    view.focus()
  }

  const lintErrors = lintMarkdown(value)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('bold')}
            title="Bold (Cmd+B)"
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('italic')}
            title="Italic (Cmd+I)"
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('heading1')}
            title="Heading 1 (Cmd+1)"
            className="h-8 w-8 p-0"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('heading2')}
            title="Heading 2 (Cmd+2)"
            className="h-8 w-8 p-0"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('heading3')}
            title="Heading 3 (Cmd+3)"
            className="h-8 w-8 p-0"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('code')}
            title="Inline code (Cmd+`)"
            className="h-8 w-8 p-0"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('link')}
            title="Insert link (Cmd+K)"
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('unorderedList')}
            title="Unordered list"
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleToolbarAction('orderedList')}
            title="Ordered list"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          {autoSave && (
            <div className="text-xs text-gray-500">
              {isAutoSaving ? (
                <span className="text-blue-600">Saving...</span>
              ) : lastSaved ? (
                <span>Saved at {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span>Draft</span>
              )}
            </div>
          )}
          {showPreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSplitView(!showSplitView)}
            >
              {showSplitView ? 'Edit Only' : 'Split View'}
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Keyboard shortcuts">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Help & Shortcuts</DialogTitle>
                <DialogDescription>Quick reference for markdown editing</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="shortcuts" className="mt-4">
                <TabsList>
                  <TabsTrigger value="shortcuts">Keyboard Shortcuts</TabsTrigger>
                  <TabsTrigger value="cheatsheet">Markdown Syntax</TabsTrigger>
                </TabsList>
                <TabsContent value="shortcuts" className="mt-4">
                  <div className="space-y-2">
                    {Object.entries(MARKDOWN_SHORTCUTS).map(([key, { key: keyCombo, description }]) => (
                      <div key={key} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">{description}</span>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                          {keyCombo.replace('Cmd', '⌘')}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="cheatsheet" className="mt-4">
                  <MarkdownCheatSheet />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          {onSave && (
            <Button type="button" variant="outline" size="sm" onClick={onSave} title="Save (Cmd+S)">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Editor and Preview */}
      <div className={showSplitView && showPreview ? 'grid grid-cols-2 gap-4' : ''}>
        <div className={showSplitView && showPreview ? '' : 'w-full'}>
          <div ref={editorRef} className="border border-gray-200 rounded-lg overflow-hidden" />
          {lintErrors.length > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              {lintErrors.length} lint {lintErrors.length === 1 ? 'warning' : 'warnings'} found
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div>
              {stats.wordCount} words · {stats.characterCount} characters · {stats.lineCount} lines
            </div>
          </div>
        </div>
        {showPreview && (showSplitView ? (
          <div className="border border-gray-200 rounded-lg p-6 bg-white max-h-[600px] overflow-y-auto">
            <MarkdownRenderer content={value || placeholder} />
          </div>
        ) : null)}
      </div>
    </div>
  )
}

