'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { completeCurriculumData } from '@/lib/curriculum-data'
import { createClient } from '@/lib/supabase/client'
import {
    Briefcase,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    Loader2,
    Search,
    Star,
    Target
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface LibrarySidebarProps {
  className?: string
  onMobileClose?: () => void
}

interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  bookmarked: boolean
}

interface ContentSearchResult {
  domainId: string
  moduleId: string
  lessonId: string
  matchInContent: boolean
  snippet?: string
}

export default function LibrarySidebar({ className = '', onMobileClose }: LibrarySidebarProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [progressMap, setProgressMap] = useState<Map<string, LessonProgress>>(new Map())
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)
  const [contentSearchResults, setContentSearchResults] = useState<Map<string, ContentSearchResult>>(new Map())
  const [isSearchingContent, setIsSearchingContent] = useState(false)

  // Fetch user progress
  useEffect(() => {
    async function fetchProgress() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoadingProgress(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_lesson_progress')
          .select('domain_id, module_id, lesson_id, status, progress_percentage, bookmarked')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching progress:', error)
        } else if (data) {
          const progress = new Map<string, LessonProgress>()
          data.forEach((item) => {
            const key = `${item.domain_id}:${item.module_id}:${item.lesson_id}`
            progress.set(key, {
              status: item.status as 'not_started' | 'in_progress' | 'completed',
              progress_percentage: item.progress_percentage || 0,
              bookmarked: item.bookmarked || false
            })
          })
          setProgressMap(progress)
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      } finally {
        setIsLoadingProgress(false)
      }
    }

    fetchProgress()
  }, [])

  // Full content search with debouncing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setContentSearchResults(new Map())
      setIsSearchingContent(false)
      return
    }

    setIsSearchingContent(true)
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search-lessons?q=${encodeURIComponent(searchQuery)}`)
        if (!response.ok) throw new Error('Search failed')
        
        const data = await response.json()
        const resultsMap = new Map<string, ContentSearchResult>()
        
        data.results.forEach((result: any) => {
          const key = `${result.domainId}:${result.moduleId}:${result.lessonId}`
          resultsMap.set(key, {
            domainId: result.domainId,
            moduleId: result.moduleId,
            lessonId: result.lessonId,
            matchInContent: result.matchInContent,
            snippet: result.snippet
          })
        })
        
        setContentSearchResults(resultsMap)
      } catch (error) {
        console.error('Error searching content:', error)
        setContentSearchResults(new Map())
      } finally {
        setIsSearchingContent(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const toggleDomain = (domainId: string) => {
    const newExpanded = new Set(expandedDomains)
    if (newExpanded.has(domainId)) {
      newExpanded.delete(domainId)
      // Also collapse all modules in this domain
      const newExpandedModules = new Set(expandedModules)
      const domain = completeCurriculumData.find(d => d.id === domainId)
      domain?.modules.forEach(module => {
        newExpandedModules.delete(`${domainId}-${module.id}`)
      })
      setExpandedModules(newExpandedModules)
    } else {
      newExpanded.add(domainId)
    }
    setExpandedDomains(newExpanded)
  }

  const toggleModule = (domainId: string, moduleId: string) => {
    const key = `${domainId}-${moduleId}`
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedModules(newExpanded)
  }

  const isActive = (path: string) => pathname === path
  const isParentActive = (path: string) => pathname.startsWith(path)

  // Filter curriculum based on search (including content matches)
  const filteredCurriculum = completeCurriculumData.map(domain => ({
    ...domain,
    modules: domain.modules.map(module => ({
      ...module,
      lessons: module.lessons.filter(lesson => {
        if (searchQuery === '') return true
        
        const searchLower = searchQuery.toLowerCase()
        const quickMatch = 
          lesson.title.toLowerCase().includes(searchLower) ||
          lesson.description.toLowerCase().includes(searchLower) ||
          module.title.toLowerCase().includes(searchLower) ||
          domain.title.toLowerCase().includes(searchLower)
        
        // Also check content search results
        const contentKey = `${domain.id}:${module.id}:${lesson.id}`
        const contentMatch = contentSearchResults.has(contentKey)
        
        return quickMatch || contentMatch
      })
    })).filter(module => 
      searchQuery === '' || 
      module.lessons.length > 0 ||
      module.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(domain => 
    searchQuery === '' || 
    domain.modules.length > 0 ||
    domain.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper to highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query || query.trim() === '') return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-200 font-medium">{part}</span>
      ) : part
    )
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-200">
        <div className="mb-3">
          <h2 className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
            Executive Library
          </h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
               <Input
                 placeholder="Search frameworks, models, case files..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-8 pr-8 h-11 md:h-8 text-sm bg-neutral-50 border border-neutral-300 text-neutral-800 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded"
               />
               {isSearchingContent && (
                 <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-neutral-400" />
               )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-neutral-200">
        <div className="space-y-0.5">
          <Button 
            asChild 
            variant="ghost"
            size="sm" 
            className={`w-full justify-start h-11 md:h-8 px-2 text-xs font-medium ${
              isActive('/library') 
                ? 'bg-neutral-100 text-neutral-900' 
                : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
            }`}
          >
            <Link href="/library" onClick={onMobileClose}>
              <FileText className="mr-2 h-3 w-3" />
              ALL ARTICLES
            </Link>
          </Button>
          <Button 
            asChild 
            variant="ghost"
            size="sm" 
            className={`w-full justify-start h-11 md:h-8 px-2 text-xs font-medium ${
              isActive('/library/curriculum') 
                ? 'bg-neutral-100 text-neutral-900' 
                : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
            }`}
          >
            <Link href="/library/curriculum" onClick={onMobileClose}>
              <Target className="mr-2 h-3 w-3" />
              CURRICULUM
            </Link>
          </Button>
          <Button 
            asChild 
            variant="ghost"
            size="sm" 
            className={`w-full justify-start h-11 md:h-8 px-2 text-xs font-medium ${
              isActive('/library/case-studies') 
                ? 'bg-neutral-100 text-neutral-900' 
                : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
            }`}
          >
            <Link href="/library/case-studies" onClick={onMobileClose}>
              <Briefcase className="mr-2 h-3 w-3" />
              CASE STUDIES
            </Link>
          </Button>
          <Button 
            asChild 
            variant="ghost"
            size="sm" 
            className={`w-full justify-start h-11 md:h-8 px-2 text-xs font-medium ${
              isActive('/library/bookmarks') 
                ? 'bg-neutral-100 text-neutral-900' 
                : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
            }`}
          >
            <Link href="/library/bookmarks" onClick={onMobileClose}>
              <Star className="mr-2 h-3 w-3" />
              BOOKMARKS
            </Link>
          </Button>
        </div>
      </div>

      {/* Curriculum Navigation */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 py-3 space-y-1">
            <div className="text-xs font-medium text-neutral-600 uppercase tracking-wide mb-3">
              DOMAINS
            </div>
          
          {isLoadingProgress ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            </div>
          ) : (
            filteredCurriculum.map((domain, domainIndex) => {
            const isDomainExpanded = expandedDomains.has(domain.id)
            const isDomainActive = isParentActive(`/library/curriculum/${domain.id}`)
            
            return (
              <div key={domain.id} className="space-y-1">
                {/* Domain */}
                <div className="group">
                  <Button
                    variant="ghost"
                    size="sm"
                            className={`w-full justify-start px-2 py-2 min-h-[44px] md:h-auto ${
                      isDomainActive ? 'bg-neutral-100' : 'hover:bg-neutral-100'
                    }`}
                    onClick={() => toggleDomain(domain.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isDomainExpanded ? (
                          <ChevronDown className="h-3 w-3 text-neutral-400" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-neutral-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-neutral-800 uppercase tracking-wide leading-tight text-left whitespace-normal word-wrap break-word">
                            {searchQuery ? highlightText(domain.title, searchQuery) : domain.title}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5 leading-snug text-left whitespace-normal word-wrap break-word">
                            {domain.modules.length} modules • {domain.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400 font-mono">
                        {String(domainIndex + 1).padStart(2, '0')}
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Modules */}
                {isDomainExpanded && (
                  <div className="space-y-1">
                    {domain.modules.map((module) => {
                      const moduleKey = `${domain.id}-${module.id}`
                      const isModuleExpanded = expandedModules.has(moduleKey)
                      const isModuleActive = isParentActive(`/library/curriculum/${domain.id}/${module.id}`)
                      
                      return (
                        <div key={module.id} className="space-y-1">
                          {/* Module */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start p-2 min-h-[44px] md:h-auto ${
                              isModuleActive ? 'bg-neutral-100' : 'hover:bg-neutral-100'
                            }`}
                            onClick={() => toggleModule(domain.id, module.id)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isModuleExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-neutral-400" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-neutral-400" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-xs text-left whitespace-normal word-wrap break-word leading-tight text-neutral-800">
                                    Module {module.number}: {searchQuery ? highlightText(module.title, searchQuery) : module.title}
                                  </div>
                                  <div className="text-xs text-neutral-500 text-left whitespace-normal word-wrap break-word">
                                    {module.lessons.length} lessons • {module.lessons.length * 12} min
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Button>

                        {/* Lessons */}
                        {isModuleExpanded && (
                          <div className="space-y-0.5">
                              {module.lessons.map((lesson) => {
                                const lessonPath = `/library/curriculum/${domain.id}/${module.id}/${lesson.id}`
                                const isLessonActive = isActive(lessonPath)
                                const progressKey = `${domain.id}:${module.id}:${lesson.id}`
                                const progress = progressMap.get(progressKey)
                                const status = progress?.status || 'not_started'
                                const progressPercentage = progress?.progress_percentage || 0
                                const isBookmarked = progress?.bookmarked || false
                                
                                // Check if this lesson matched in content
                                const contentMatch = contentSearchResults.get(progressKey)
                                const isContentMatch = contentMatch?.matchInContent || false
                                
                                return (
                                  <Button
                                    key={lesson.id}
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className={`w-full justify-start p-2 min-h-[44px] md:h-auto ${
                                      isLessonActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50'
                                    }`}
                                  >
                                    <Link href={lessonPath} onClick={onMobileClose}>
                                      <div className="flex items-center gap-2 w-full">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {/* Progress Indicator */}
                                          <div className="relative flex-shrink-0">
                                            {status === 'completed' ? (
                                              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                                                <CheckCircle className="h-3 w-3 text-white" />
                                              </div>
                                            ) : status === 'in_progress' ? (
                                              <div className="w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center relative">
                                                {progressPercentage > 0 && (
                                                  <svg className="w-5 h-5 absolute inset-0 transform -rotate-90">
                                                    <circle
                                                      cx="10"
                                                      cy="10"
                                                      r="8"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      strokeWidth="2"
                                                      strokeDasharray={`${2 * Math.PI * 8}`}
                                                      strokeDashoffset={`${2 * Math.PI * 8 * (1 - progressPercentage / 100)}`}
                                                      className="text-blue-600"
                                                    />
                                                  </svg>
                                                )}
                                                <span className="text-xs font-medium text-blue-600 relative z-10">
                                                  {lesson.number}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center">
                                                <span className="text-xs font-medium text-neutral-600">
                                                  {lesson.number}
                                                </span>
                                              </div>
                                            )}
                                            {isBookmarked && (
                                              <div className="absolute -top-1 -right-1">
                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                              </div>
                                            )}
                                          </div>
                                                     <div className="flex-1 min-w-0">
                                                       <div className="text-xs font-medium text-left whitespace-normal word-wrap break-word leading-tight flex items-center gap-1.5">
                                                         {searchQuery ? highlightText(lesson.title, searchQuery) : lesson.title}
                                                         {isContentMatch && (
                                                           <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium" title="Found in lesson content">
                                                             CONTENT
                                                           </span>
                                                         )}
                                                       </div>
                                                       <div className="text-xs text-neutral-500 flex items-center gap-1">
                                                         <Clock className="h-3 w-3" />
                                                         <span>12 min</span>
                                                         {progressPercentage > 0 && status !== 'completed' && (
                                                           <span className="text-blue-600">• {progressPercentage}%</span>
                                                         )}
                                                       </div>
                                                     </div>
                                        </div>
                                      </div>
                                    </Link>
                                  </Button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }))}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-neutral-200">
        <div className="text-xs text-neutral-500 space-y-1">
          <div className="flex justify-between">
            <span>Total Domains:</span>
            <span className="font-medium">{completeCurriculumData.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Lessons:</span>
            <span className="font-medium">
              {completeCurriculumData.reduce((sum, d) => 
                sum + d.modules.reduce((mSum, m) => mSum + m.lessons.length, 0), 0
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Est. Time:</span>
            <span className="font-medium">
              {Math.round(completeCurriculumData.reduce((sum, d) => 
                sum + d.modules.reduce((mSum, m) => mSum + m.lessons.length, 0), 0
              ) * 12 / 60)} hours
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}