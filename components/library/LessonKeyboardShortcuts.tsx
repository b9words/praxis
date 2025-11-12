'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LessonKeyboardShortcutsProps {
  nextLessonUrl?: string | null
  prevLessonUrl?: string | null
}

export default function LessonKeyboardShortcuts({
  nextLessonUrl,
  prevLessonUrl,
}: LessonKeyboardShortcutsProps) {
  const router = useRouter()
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      // Show shortcuts dialog
      if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts(true)
        return
      }

      // Navigate to next lesson
      if (e.key === 'n' && nextLessonUrl) {
        e.preventDefault()
        router.push(nextLessonUrl)
        return
      }

      // Navigate to previous lesson
      if (e.key === 'p' && prevLessonUrl) {
        e.preventDefault()
        router.push(prevLessonUrl)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, nextLessonUrl, prevLessonUrl])

  return (
    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate lessons quickly
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Show shortcuts</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-300 rounded">
              ?
            </kbd>
          </div>
          {nextLessonUrl && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Next lesson</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-300 rounded">
                n
              </kbd>
            </div>
          )}
          {prevLessonUrl && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Previous lesson</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-300 rounded">
                p
              </kbd>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

