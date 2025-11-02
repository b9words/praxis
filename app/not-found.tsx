'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 w-full">
        <div className="flex justify-center">
          <div className="max-w-md w-full text-center">
            <div className="bg-white border border-neutral-200 p-8">
              <AlertTriangle className="h-16 w-16 text-neutral-700 mx-auto mb-4" />
              <h1 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
                Error 404
              </h1>
              <p className="text-neutral-600 mb-6">
                The requested asset could not be located. Double-check your coordinates or return to the main dashboard.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => (window.location.href = '/')} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none">
                  Return to Dashboard
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = '/library')} className="border-neutral-300 hover:border-neutral-400 rounded-none">
                  Go to Library
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

