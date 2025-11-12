'use client'

import { useLibraryUiStore } from '@/lib/ui/library-ui-store'
import { useEffect } from 'react'

export default function LibraryShortcuts() {
  const toggleSidebarMode = useLibraryUiStore((state) => state.toggleSidebarMode)
  const setSidebarMode = useLibraryUiStore((state) => state.setSidebarMode)
  const sidebarMode = useLibraryUiStore((state) => state.sidebarMode)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift+S: Toggle sidebar mode
      if (e.shiftKey && e.key === 'S' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only handle if not in an input/textarea/contenteditable
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        e.preventDefault()
        toggleSidebarMode()
      }

      // /: Focus search (expand if in rail mode)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // Only handle if not in an input/textarea/contenteditable
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        e.preventDefault()

        // If in rail mode, expand first
        if (sidebarMode === 'rail') {
          setSidebarMode('expanded')
          // Wait for expansion animation, then focus
          setTimeout(() => {
            const searchInput = document.querySelector(
              '[placeholder="Search frameworks, models, case files..."]'
            ) as HTMLInputElement
            searchInput?.focus()
          }, 150)
        } else {
          // Already expanded, just focus search
          const searchInput = document.querySelector(
            '[placeholder="Search frameworks, models, case files..."]'
          ) as HTMLInputElement
          searchInput?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggleSidebarMode, setSidebarMode, sidebarMode])

  // This component doesn't render anything
  return null
}

