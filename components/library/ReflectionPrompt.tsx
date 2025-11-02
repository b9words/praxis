'use client'

import { useState, useEffect, useRef } from 'react'
import { PenTool, Save } from 'lucide-react'
import { fetchJson } from '@/lib/api'

interface ReflectionPromptProps {
  prompt: string
  lessonId: string
  domainId: string
  moduleId: string
  initialReflection?: string
}

export default function ReflectionPrompt({
  prompt,
  lessonId,
  domainId,
  moduleId,
  initialReflection = '',
}: ReflectionPromptProps) {
  const [reflection, setReflection] = useState(initialReflection)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const saveReflection = async () => {
    if (!reflection.trim()) return

    setIsSaving(true)
    try {
      // Get current progress to preserve other lastReadPosition data
      const progressList = await fetchJson<{ progress: any[] }>(
        `/api/progress/lessons?domainId=${domainId}&moduleId=${moduleId}&lessonId=${lessonId}`
      ).catch(() => ({ progress: [] }))

      const currentProgress = progressList?.progress?.[0]
      const currentLastReadPosition = currentProgress?.last_read_position || {}
      const updatedLastReadPosition = {
        ...currentLastReadPosition,
        reflections: {
          ...(currentLastReadPosition.reflections || {}),
          [prompt.substring(0, 50)]: reflection.trim(),
        },
      }

      await fetchJson('/api/progress/lessons', {
        method: 'PUT',
        body: JSON.stringify({
          domainId,
          moduleId,
          lessonId,
          lastReadPosition: updatedLastReadPosition,
        }),
      })

      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving reflection:', error)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    // Auto-save every 30 seconds if there's content
    if (reflection.trim() && reflection !== initialReflection) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveReflection()
      }, 30000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [reflection])

  return (
    <div className="my-6 border border-neutral-200 bg-white rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <PenTool className="h-5 w-5 text-purple-600" />
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
          Reflection
        </h3>
      </div>
      <p className="text-sm text-neutral-700 mb-4">{prompt}</p>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="Take a moment to reflect on this topic..."
        className="w-full min-h-[120px] p-3 border border-neutral-300 rounded text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
      />
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {lastSaved && (
            <span className="flex items-center gap-1">
              <Save className="h-3 w-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isSaving && (
            <span className="text-blue-600">Saving...</span>
          )}
        </div>
        <button
          onClick={saveReflection}
          disabled={!reflection.trim() || isSaving}
          className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save Reflection
        </button>
      </div>
      <p className="text-xs text-neutral-400 mt-2">
        Your reflection is saved privately and only visible to you.
      </p>
    </div>
  )
}

