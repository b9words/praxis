'use client'

import { ReactNode } from 'react'

interface CaseStudyLayoutProps {
  header: ReactNode
  children: ReactNode
  footer: ReactNode
}

export default function CaseStudyLayout({ header, children, footer }: CaseStudyLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Non-scrollable header */}
      <div className="flex-shrink-0">
        {header}
      </div>
      
      {/* Scrollable main content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6">
          {children}
        </div>
      </main>
      
      {/* Non-scrollable footer */}
      <div className="flex-shrink-0">
        {footer}
      </div>
    </div>
  )
}
