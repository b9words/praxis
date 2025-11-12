'use client'

import LibrarySidebar from '@/components/library/LibrarySidebar'
import LibraryShortcuts from '@/components/library/LibraryShortcuts'
import { Button } from '@/components/ui/button'
import { useLibraryUiStore } from '@/lib/ui/library-ui-store'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const sidebarMode = useLibraryUiStore((state) => state.sidebarMode)
  const pathname = usePathname()
  const mobileOverlayRef = useRef<HTMLDivElement>(null)

  // Auto-close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Focus trap for mobile overlay
  useEffect(() => {
    if (isMobileMenuOpen && mobileOverlayRef.current) {
      const firstFocusable = mobileOverlayRef.current.querySelector(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }
  }, [isMobileMenuOpen])

  // Restore focus on close
  const handleMobileClose = () => {
    setIsMobileMenuOpen(false)
    // Restore focus to menu button
    const menuButton = document.querySelector('[aria-label="Open menu"]') as HTMLElement
    menuButton?.focus()
  }

  const sidebarWidth = sidebarMode === 'expanded' ? 'w-[320px]' : 'w-[64px]'

  return (
    <>
      <LibraryShortcuts />
      <div className="h-screen bg-white flex flex-col">
        {/* Mobile Header */}
      <div className="md:hidden border-b border-neutral-200 bg-white flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 hover:bg-neutral-100"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-neutral-600" />
          </Button>
          <h1 className="text-base font-semibold leading-tight text-neutral-900">
            Library
          </h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className={`hidden md:block ${sidebarWidth} border-r border-neutral-200 bg-white flex-shrink-0 transition-all duration-200`}>
          <LibrarySidebar />
        </div>
        
        {/* Main Content - NO MARGINS */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
      
      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50" ref={mobileOverlayRef}>
          <div 
            className="fixed inset-0 bg-neutral-900/50" 
            onClick={handleMobileClose}
            aria-hidden="true"
          />
          <div 
            className="fixed inset-y-0 left-0 w-[320px] bg-white border-r border-neutral-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <LibrarySidebar onMobileClose={handleMobileClose} />
          </div>
        </div>
      )}
      </div>
    </>
  )
}