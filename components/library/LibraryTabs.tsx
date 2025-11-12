'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Target, Bookmark, TrendingUp, ArrowRight } from 'lucide-react'

interface LibraryTabsProps {
  continueContent: React.ReactNode
  articlesContent: React.ReactNode
  caseStudiesContent: React.ReactNode
  savedContent: React.ReactNode
  trendingContent: React.ReactNode
}

export default function LibraryTabs({
  continueContent,
  articlesContent,
  caseStudiesContent,
  savedContent,
  trendingContent,
}: LibraryTabsProps) {
  return (
    <Tabs defaultValue="continue" className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-transparent border-b border-neutral-200 rounded-none h-auto">
        <TabsTrigger
          value="continue"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <ArrowRight className="h-3 w-3 mr-2" />
          Continue
        </TabsTrigger>
        <TabsTrigger
          value="articles"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <BookOpen className="h-3 w-3 mr-2" />
          Articles
        </TabsTrigger>
        <TabsTrigger
          value="case-studies"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <Target className="h-3 w-3 mr-2" />
          Case Studies
        </TabsTrigger>
        <TabsTrigger
          value="saved"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <Bookmark className="h-3 w-3 mr-2" />
          Saved
        </TabsTrigger>
        <TabsTrigger
          value="trending"
          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide py-3 rounded-none"
        >
          <TrendingUp className="h-3 w-3 mr-2" />
          Trending
        </TabsTrigger>
      </TabsList>

      <TabsContent value="continue" className="mt-0">
        {continueContent}
      </TabsContent>
      <TabsContent value="articles" className="mt-0">
        {articlesContent}
      </TabsContent>
      <TabsContent value="case-studies" className="mt-0">
        {caseStudiesContent}
      </TabsContent>
      <TabsContent value="saved" className="mt-0">
        {savedContent}
      </TabsContent>
      <TabsContent value="trending" className="mt-0">
        {trendingContent}
      </TabsContent>
    </Tabs>
  )
}

