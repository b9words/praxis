'use client'

import LibrarySidebar from '@/components/library/LibrarySidebar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden border-b border-neutral-200 bg-white flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 hover:bg-neutral-100"
            onClick={() => setIsMobileMenuOpen(true)}
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
        <div className="hidden md:block w-[320px] border-r border-neutral-200 bg-white flex-shrink-0">
          <LibrarySidebar />
        </div>
        
        {/* Main Content - NO MARGINS */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
      
      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div 
            className="fixed inset-0 bg-neutral-900/50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[320px] bg-white border-r border-neutral-200">
            <LibrarySidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}