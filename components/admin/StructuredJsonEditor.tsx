'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { foldGutter, bracketMatching, defaultHighlightStyle } from '@codemirror/language'
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { lintKeymap } from '@codemirror/lint'
import { keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface StructuredJsonEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  title?: string
  description?: string
}

export default function StructuredJsonEditor({
  value,
  onChange,
  placeholder = '{\n  "key": "value"\n}',
  minHeight = '300px',
  title,
  description,
}: StructuredJsonEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(true)

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    const state = EditorState.create({
      doc: value || placeholder,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        defaultHighlightStyle.fallback,
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        json(),
        // JSON validation is handled manually via JSON.parse
        EditorState.tabSize.of(2),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString()
            onChange(newValue)

            // Validate JSON
            try {
              if (newValue.trim()) {
                JSON.parse(newValue)
                setJsonError(null)
                setIsValid(true)
              } else {
                setJsonError(null)
                setIsValid(true)
              }
            } catch (e) {
              setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
              setIsValid(false)
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
          '.cm-lint-marker': {
            color: '#ef4444',
          },
        }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, []) // Only run once

  // Update editor content when value prop changes (but not from user typing)
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: value || placeholder },
      })
      viewRef.current.dispatch(transaction)
    }
  }, [value, placeholder])

  // Validate initial value
  useEffect(() => {
    if (value) {
      try {
        JSON.parse(value)
        setJsonError(null)
        setIsValid(true)
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
        setIsValid(false)
      }
    }
  }, [value])

  return (
    <div className="space-y-2">
      {title && (
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      )}
      <div ref={editorRef} className="border border-gray-200 rounded-lg overflow-hidden" />
      {jsonError && (
        <Alert className="border-red-200 bg-red-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <AlertDescription className="text-red-800">{jsonError}</AlertDescription>
          </div>
        </Alert>
      )}
      {isValid && value && value.trim() && (
        <Alert className="border-green-200 bg-green-50">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <AlertDescription className="text-green-800">Valid JSON</AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  )
}

