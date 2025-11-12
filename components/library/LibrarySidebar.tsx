'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { fetchJson } from '@/lib/api'
import { completeCurriculumData } from '@/lib/curriculum-data'
import { queryKeys } from '@/lib/queryKeys'
import { useLibraryUiStore } from '@/lib/ui/library-ui-store'
import { useQuery } from '@tanstack/react-query'
import {
    Briefcase,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
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
import { useRef, useState } from 'react'

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
  const sidebarMode = useLibraryUiStore((state) => state.sidebarMode)
  const setSidebarMode = useLibraryUiStore((state) => state.setSidebarMode)
  const toggleSidebarMode = useLibraryUiStore((state) => state.toggleSidebarMode)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Check if we're on mobile (when onMobileClose is provided, we're in mobile overlay)
  const isMobile = !!onMobileClose
  // Rail mode is desktop-only
  const isRail = !isMobile && sidebarMode === 'rail'

  // Fetch user progress with React Query
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: queryKeys.progress.lessons(),
    queryFn: ({ signal }) => fetchJson<{ progress: any[] }>('/api/progress/lessons', { signal }),
    retry: false,
  })

  // Build progress map from API data
  const progressMap = new Map<string, LessonProgress>()
  if (progressData?.progress) {
    progressData.progress.forEach((item: any) => {
      const key = `${item.domain_id}:${item.module_id}:${item.lesson_id}`
      progressMap.set(key, {
        status: item.status as 'not_started' | 'in_progress' | 'completed',
        progress_percentage: item.progress_percentage || 0,
        bookmarked: item.bookmarked || false,
      })
    })
  }

  // Full content search with React Query and debouncing
  const { data: searchData, isLoading: isSearchingContent } = useQuery({
    queryKey: queryKeys.search.lessons(searchQuery),
    queryFn: ({ signal }) =>
      fetchJson<{ results: ContentSearchResult[] }>(`/api/search-lessons?q=${encodeURIComponent(searchQuery)}`, { signal }),
    enabled: !!searchQuery && searchQuery.trim().length >= 2,
    staleTime: 30000,
  })

  // Build content search results map
  const contentSearchResults = new Map<string, ContentSearchResult>()
  if (searchData?.results) {
    searchData.results.forEach((result) => {
      const key = `${result.domainId}:${result.moduleId}:${result.lessonId}`
      contentSearchResults.set(key, result)
    })
  }

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
        <span key={index} className="bg-gray-200 font-medium">{part}</span>
      ) : part
    )
  }

  const handleSearchClick = () => {
    if (isRail) {
      setSidebarMode('expanded')
      // Focus search input after expansion
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }

  const NavButton = ({ 
    href, 
    icon: Icon, 
    label, 
    isActive: active 
  }: { 
    href: string
    icon: typeof FileText
    label: string
    isActive: boolean
  }) => {
    const buttonContent = (
      <Button 
        asChild 
        variant="ghost"
        size={isRail ? "icon" : "sm"}
        className={`${isRail ? 'w-full h-12' : 'w-full justify-start h-11 md:h-8 px-2'} text-xs font-medium ${
          active 
            ? 'bg-neutral-100 text-neutral-900' 
            : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
        }`}
      >
        <Link href={href} onClick={onMobileClose}>
          <Icon className={isRail ? 'h-5 w-5' : 'mr-2 h-3 w-3'} />
          {!isRail && label}
        </Link>
      </Button>
    )

    if (isRail) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return buttonContent
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className={`flex-shrink-0 ${isRail ? 'px-2 py-2' : 'px-4 py-3'} border-b border-neutral-200`}>
        {!isRail && (
          <div className="mb-3">
            <h2 className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Executive Library
            </h2>
          </div>
        )}
        
        {/* Search */}
        {isRail ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-12 hover:bg-neutral-100"
                  onClick={handleSearchClick}
                  aria-label="Search"
                >
                  <Search className="h-5 w-5 text-neutral-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Search
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search frameworks, models, case files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-11 md:h-8 text-sm bg-neutral-50 border border-neutral-300 text-neutral-800 placeholder:text-neutral-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 rounded-none"
            />
            {isSearchingContent && (
              <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-neutral-400" />
            )}
          </div>
        )}

        {/* Toggle Button - Desktop only */}
        {!isMobile && (
          <div className={isRail ? 'mt-2' : 'mt-3'}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isRail ? "icon" : "sm"}
                    className={`${isRail ? 'w-full h-10' : 'w-full justify-start h-8 px-2'} text-xs text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100`}
                    onClick={toggleSidebarMode}
                    aria-label={isRail ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {isRail ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <>
                        <ChevronLeft className="mr-2 h-3 w-3" />
                        Collapse
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {isRail && (
                  <TooltipContent side="right" sideOffset={8}>
                    Expand sidebar
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className={`flex-shrink-0 ${isRail ? 'px-2 py-2' : 'px-4 py-2'} border-b border-neutral-200`}>
        {isRail ? (
          <TooltipProvider>
            <div className="space-y-1">
              <NavButton 
                href="/library" 
                icon={FileText} 
                label="ALL ARTICLES" 
                isActive={isActive('/library')} 
              />
              <NavButton 
                href="/library/curriculum" 
                icon={Target} 
                label="CURRICULUM" 
                isActive={isActive('/library/curriculum')} 
              />
              <NavButton 
                href="/library/case-studies" 
                icon={Briefcase} 
                label="CASE STUDIES" 
                isActive={isActive('/library/case-studies')} 
              />
              <NavButton 
                href="/library/bookmarks" 
                icon={Star} 
                label="BOOKMARKS" 
                isActive={isActive('/library/bookmarks')} 
              />
            </div>
          </TooltipProvider>
        ) : (
          <div className="space-y-0.5">
            <NavButton 
              href="/library" 
              icon={FileText} 
              label="ALL ARTICLES" 
              isActive={isActive('/library')} 
            />
            <NavButton 
              href="/library/curriculum" 
              icon={Target} 
              label="CURRICULUM" 
              isActive={isActive('/library/curriculum')} 
            />
            <NavButton 
              href="/library/case-studies" 
              icon={Briefcase} 
              label="CASE STUDIES" 
              isActive={isActive('/library/case-studies')} 
            />
            <NavButton 
              href="/library/bookmarks" 
              icon={Star} 
              label="BOOKMARKS" 
              isActive={isActive('/library/bookmarks')} 
            />
          </div>
        )}
      </div>

      {/* Curriculum Navigation - Hidden in rail mode */}
      {!isRail && (
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
                                      isLessonActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-neutral-600 hover:bg-neutral-50'
                                    }`}
                                  >
                                    <Link href={lessonPath} onClick={onMobileClose}>
                                      <div className="flex items-center gap-2 w-full">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {/* Progress Indicator */}
                                          <div className="relative flex-shrink-0">
                                            {status === 'completed' ? (
                                              <div className="w-5 h-5 bg-gray-900 flex items-center justify-center">
                                                <CheckCircle className="h-3 w-3 text-white" />
                                              </div>
                                            ) : status === 'in_progress' ? (
                                              <div className="w-5 h-5 bg-gray-100 border-2 border-gray-600 flex items-center justify-center relative">
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
                                                      className="text-gray-600"
                                                    />
                                                  </svg>
                                                )}
                                                <span className="text-xs font-medium text-gray-700 relative z-10">
                                                  {lesson.number}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="w-5 h-5 bg-neutral-100 border border-neutral-200 flex items-center justify-center">
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
                                                           <span className="text-[10px] text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.5 font-medium" title="Found in lesson content">
                                                             CONTENT
                                                           </span>
                                                         )}
                                                       </div>
                                                       <div className="text-xs text-neutral-500 flex items-center gap-1">
                                                         <Clock className="h-3 w-3" />
                                                         <span>12 min</span>
                                                         {progressPercentage > 0 && status !== 'completed' && (
                                                           <span className="text-gray-700">• {progressPercentage}%</span>
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
      )}

      {/* Footer - Hidden in rail mode */}
      {!isRail && (
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
      )}
    </div>
  )
}