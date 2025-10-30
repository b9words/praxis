'use client'

import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import LibrarySidebar from './LibrarySidebar'

interface MobileHeaderProps {
  title: string
  className?: string
}

export default function MobileHeader({ title, className = '' }: MobileHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className={`md:hidden border-b border-neutral-200 bg-white ${className}`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 hover:bg-neutral-100"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5 text-neutral-600" />
          </Button>
          <h1 className="text-base font-semibold leading-tight text-neutral-900">
            {title}
          </h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-neutral-900/50">
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white border-r border-neutral-200">
            {/* Close Button */}
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Navigation</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 hover:bg-neutral-100"
                onClick={toggleMobileMenu}
              >
                <X className="h-5 w-5 text-neutral-600" />
              </Button>
            </div>
            
            {/* Sidebar Content */}
            <LibrarySidebar className="border-none" />
          </div>
        </div>
      )}
    </>
  )
}
