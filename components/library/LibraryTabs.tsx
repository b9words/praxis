'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Target, Bookmark, ArrowRight, Users } from 'lucide-react'
import { useState } from 'react'

interface LibraryTabsProps {
  myTrackContent: React.ReactNode
  articlesContent: React.ReactNode
  caseStudiesContent: React.ReactNode
  debriefsContent: React.ReactNode
  savedContent: React.ReactNode
}

export default function LibraryTabs({
  myTrackContent,
  articlesContent,
  caseStudiesContent,
  debriefsContent,
  savedContent,
}: LibraryTabsProps) {
  const [browseSubTab, setBrowseSubTab] = useState<'articles' | 'case-studies'>('articles')

  return (
    <Tabs defaultValue="my-track" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-neutral-200 rounded-none h-auto">
        <TabsTrigger
          value="my-track"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <ArrowRight className="h-3 w-3 mr-2" />
          My Track
        </TabsTrigger>
        <TabsTrigger
          value="browse"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <BookOpen className="h-3 w-3 mr-2" />
          Browse
        </TabsTrigger>
        <TabsTrigger
          value="debriefs"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <Users className="h-3 w-3 mr-2" />
          Debriefs
        </TabsTrigger>
        <TabsTrigger
          value="saved"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <Bookmark className="h-3 w-3 mr-2" />
          Saved
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-track" className="mt-0">
        {myTrackContent}
      </TabsContent>
      <TabsContent value="browse" className="mt-0">
        <div className="space-y-6">
          {/* Browse Sub-tabs */}
          <div className="border-b border-neutral-200">
            <div className="flex gap-4">
              <button
                onClick={() => setBrowseSubTab('articles')}
                className={`pb-3 text-xs font-medium uppercase tracking-wide transition-colors ${
                  browseSubTab === 'articles'
                    ? 'text-neutral-900 border-b-2 border-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <BookOpen className="h-3 w-3 inline mr-2" />
                Articles
              </button>
              <button
                onClick={() => setBrowseSubTab('case-studies')}
                className={`pb-3 text-xs font-medium uppercase tracking-wide transition-colors ${
                  browseSubTab === 'case-studies'
                    ? 'text-neutral-900 border-b-2 border-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Target className="h-3 w-3 inline mr-2" />
                Case Studies
              </button>
            </div>
          </div>
          {browseSubTab === 'articles' && articlesContent}
          {browseSubTab === 'case-studies' && caseStudiesContent}
        </div>
      </TabsContent>
      <TabsContent value="debriefs" className="mt-0">
        {debriefsContent}
      </TabsContent>
      <TabsContent value="saved" className="mt-0">
        {savedContent}
      </TabsContent>
    </Tabs>
  )
}

