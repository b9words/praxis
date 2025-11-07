'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Sparkles } from 'lucide-react'
import CurriculumGenerator from '@/components/admin/CurriculumGenerator'
import CaseBlueprintsPanel from '@/components/admin/CaseBlueprintsPanel'
import CaseAssetsManager from '@/components/admin/CaseAssetsManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface GeneratePanelProps {
  open: boolean
  onClose: () => void
  defaultTab?: 'lessons' | 'cases'
}

export default function GeneratePanel({ open, onClose, defaultTab = 'lessons' }: GeneratePanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-50 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-xl transition-transform duration-300 ease-in-out pointer-events-auto',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Generate Content</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'lessons' | 'cases')} className="w-full">
          <div className="sticky top-0 z-10 bg-white border-b px-4">
            <TabsList className="w-full">
              <TabsTrigger value="lessons" className="flex-1">
                Generate Lessons
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex-1">
                Generate Cases
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="lessons" className="mt-0 px-4 py-4">
            <CurriculumGenerator />
          </TabsContent>

          <TabsContent value="cases" className="mt-0 px-4 py-4">
            <div className="space-y-4">
              <CaseBlueprintsPanel />
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Case Assets Manager</h3>
                <CaseAssetsManager />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

