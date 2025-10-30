'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useCaseStudyStore } from '@/lib/case-study-store'
import { AlertCircle, FileText, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RichTextEditorBlockProps {
  blockId: string
  title?: string
  placeholder?: string
  maxLength?: number
  minLength?: number
  required?: boolean
  autoSave?: boolean
  showWordCount?: boolean
}

export default function RichTextEditorBlock({
  blockId,
  title = 'Your Response',
  placeholder = 'Start writing your analysis here...',
  maxLength = 5000,
  minLength = 100,
  required = true,
  autoSave = true,
  showWordCount = true
}: RichTextEditorBlockProps) {
  const { getBlockState, updateBlockState, currentStageId } = useCaseStudyStore()
  const [content, setContent] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load existing content on mount
  useEffect(() => {
    if (currentStageId) {
      const blockState = getBlockState(currentStageId, blockId)
      if (blockState?.content) {
        setContent(blockState.content)
      }
    }
  }, [currentStageId, blockId, getBlockState])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !currentStageId) return

    const timeoutId = setTimeout(() => {
      if (content.trim()) {
        setIsSaving(true)
        updateBlockState(currentStageId, blockId, {
          content,
          wordCount: getWordCount(content),
          isValid: validateContent(content),
          lastUpdated: new Date().toISOString()
        })
        setLastSaved(new Date())
        setIsSaving(false)
      }
    }, 1000) // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId)
  }, [content, autoSave, currentStageId, blockId, updateBlockState])

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getCharacterCount = (text: string): number => {
    return text.length
  }

  const validateContent = (text: string): boolean => {
    const wordCount = getWordCount(text)
    const charCount = getCharacterCount(text)
    
    if (required && wordCount === 0) return false
    if (minLength && wordCount < minLength) return false
    if (maxLength && charCount > maxLength) return false
    
    return true
  }

  const handleContentChange = (value: string) => {
    setContent(value)
  }

  const handleManualSave = () => {
    if (currentStageId) {
      setIsSaving(true)
      updateBlockState(currentStageId, blockId, {
        content,
        wordCount: getWordCount(content),
        isValid: validateContent(content),
        lastUpdated: new Date().toISOString()
      })
      setLastSaved(new Date())
      setIsSaving(false)
    }
  }

  const wordCount = getWordCount(content)
  const charCount = getCharacterCount(content)
  const isValid = validateContent(content)
  const isOverLimit = maxLength && charCount > maxLength

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
          {!autoSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
        
        {showWordCount && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-neutral-600">
              <span>Words: {wordCount}</span>
              <span>Characters: {charCount}{maxLength && `/${maxLength}`}</span>
              {minLength && wordCount < minLength && (
                <span className="text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Minimum {minLength} words required
                </span>
              )}
            </div>
            
            {lastSaved && autoSave && (
              <span className="text-xs text-neutral-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            className={`min-h-[300px] resize-y ${
              isOverLimit ? 'border-red-300 focus:border-red-500' : 
              !isValid ? 'border-orange-300 focus:border-orange-500' : 
              'border-neutral-300 focus:border-blue-500'
            }`}
            maxLength={maxLength}
          />
          
          {/* Validation Messages */}
          <div className="space-y-1">
            {isOverLimit && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Content exceeds maximum length of {maxLength} characters
              </p>
            )}
            
            {required && wordCount === 0 && (
              <p className="text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                This field is required
              </p>
            )}
            
            {minLength && wordCount > 0 && wordCount < minLength && (
              <p className="text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Minimum {minLength} words required ({minLength - wordCount} more needed)
              </p>
            )}
          </div>
          
          {/* Writing Tips */}
          <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded">
            <strong>Writing Tips:</strong> Be specific and data-driven. Reference case materials directly. 
            Structure your argument clearly with evidence from the provided documents.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}