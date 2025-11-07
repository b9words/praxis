'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { foldGutter, foldKeymap, bracketMatching, defaultHighlightStyle } from '@codemirror/language'
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
  const isUpdatingFromProp = useRef(false) // Flag to prevent infinite loops

  // Helper to check if content matches placeholder
  const isPlaceholder = (content: string) => {
    if (!content || !placeholder) return false
    return content.trim() === placeholder.trim() || content.trim() === ''
  }

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    // Use empty string if value is empty, not placeholder
    const initialContent = value && value.trim() ? value : ''

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
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
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        json(),
        // JSON validation is handled manually via JSON.parse
        EditorState.tabSize.of(2),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdatingFromProp.current) {
            const newValue = update.state.doc.toString()
            // Only call onChange if it's not placeholder content and not from prop update
            if (!isPlaceholder(newValue)) {
              onChange(newValue)
            } else {
              onChange('')
            }

            // Validate JSON - skip if empty or placeholder
            try {
              const trimmed = newValue.trim()
              if (trimmed && !isPlaceholder(trimmed)) {
                JSON.parse(trimmed)
                setJsonError(null)
                setIsValid(true)
              } else {
                // Empty or placeholder - valid state (no error)
                setJsonError(null)
                setIsValid(true)
              }
            } catch (e) {
              setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
              setIsValid(false)
            }
          }
        }),
        // Custom placeholder extension
        EditorView.contentAttributes.of({
          'data-placeholder': value && value.trim() ? '' : placeholder,
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
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString()
      const newContent = value && value.trim() ? value : ''
      // Only update if content actually changed
      if (currentContent !== newContent) {
        isUpdatingFromProp.current = true // Set flag to prevent onChange from firing
        const transaction = viewRef.current.state.update({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: newContent },
        })
        viewRef.current.dispatch(transaction)
        // Reset flag after a short delay to allow transaction to complete
        setTimeout(() => {
          isUpdatingFromProp.current = false
        }, 0)
      }
    }
  }, [value])

  // Validate initial value
  useEffect(() => {
    const trimmed = value?.trim() || ''
    if (trimmed && !isPlaceholder(trimmed)) {
      try {
        JSON.parse(trimmed)
        setJsonError(null)
        setIsValid(true)
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
        setIsValid(false)
      }
    } else {
      // Empty or placeholder - valid state
      setJsonError(null)
      setIsValid(true)
    }
  }, [value, placeholder])

  return (
    <div className="space-y-2">
      {title && (
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      )}
      <div className="relative">
        <div ref={editorRef} className="border border-gray-200 rounded-lg overflow-hidden" />
        {(!value || !value.trim()) && placeholder && (
          <div className="absolute top-4 left-4 pointer-events-none text-muted-foreground text-sm font-mono whitespace-pre opacity-60">
            {placeholder}
          </div>
        )}
      </div>
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

