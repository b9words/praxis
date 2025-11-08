'use client'

import AdminContentTable from '@/components/admin/AdminContentTable'
import AdminDetailsDrawer from '@/components/admin/AdminDetailsDrawer'
import AdminOverview from '@/components/admin/AdminOverview'
import AdminTree from '@/components/admin/AdminTree'
import GeneratePanel from '@/components/admin/GeneratePanel'
import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

interface ContentItem {
  id: string
  type: 'article' | 'case'
  title: string
  status: string
  published?: boolean
  updatedAt: Date | string
  competency?: { name: string }
  storagePath?: string | null
  content?: string
  briefingDoc?: string
  metadata?: {
    competencyName?: string
    competencies?: string[]
  }
  creator?: { username: string }
  updater?: { username: string }
}

export default function AdminContentClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // URL-backed filters and pagination
  const filters = {
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '__all__',
    status: searchParams.get('status') || '__all__',
    arena: searchParams.get('arena') || undefined,
    competency: searchParams.get('competency') || undefined,
  }
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [detailsItem, setDetailsItem] = useState<ContentItem | null>(null)
  const [generatePanelOpen, setGeneratePanelOpen] = useState(false)

  // Fetch competencies
  const { data: competencies = [] } = useQuery({
    queryKey: ['admin-content', 'competencies'],
    queryFn: async () => {
      const res = await fetch('/api/admin/content/competencies', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch competencies')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch articles
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['admin-content', 'articles', filters, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.status !== '__all__') params.set('status', filters.status)
      if (filters.competency) params.set('competency', filters.competency)
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())
      const res = await fetch(`/api/admin/content/articles?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch articles')
      const data = await res.json()
      return {
        items: data.items.map((a: any) => ({
          ...a,
          type: 'article' as const,
          published: a.published ?? false,
          updatedAt: new Date(a.updatedAt),
          metadata: a.metadata || {},
        })),
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      }
    },
    enabled: filters.type === '__all__' || filters.type === 'article',
  })

  // Fetch cases
  const { data: casesData, isLoading: casesLoading } = useQuery({
    queryKey: ['admin-content', 'cases', filters, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.status !== '__all__') params.set('status', filters.status)
      if (filters.competency) params.set('competency', filters.competency)
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())
      const res = await fetch(`/api/admin/content/cases?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch cases')
      const data = await res.json()
      return {
        items: data.items.map((c: any) => ({
          ...c,
          type: 'case' as const,
          published: c.published ?? false,
          updatedAt: new Date(c.updatedAt),
        })),
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      }
    },
    enabled: filters.type === '__all__' || filters.type === 'case',
    staleTime: 0, // Always consider stale, so refetch on mount/invalidate
    refetchOnMount: 'always', // Always refetch when component mounts
  })

  // Combine data based on type filter
  const contentData = useMemo(() => {
    const defaultData = { items: [], total: 0, page: 1, pageSize, totalPages: 0 }
    
    if (filters.type === 'article') {
      return articlesData || defaultData
    }
    if (filters.type === 'case') {
      return casesData || defaultData
    }
    // Combine both when type is '__all__'
    const articles = articlesData?.items || []
    const cases = casesData?.items || []
    return {
      items: [...articles, ...cases].sort((a, b) => {
        const aDate = new Date(a.updatedAt).getTime()
        const bDate = new Date(b.updatedAt).getTime()
        return bDate - aDate
      }),
      total: (articlesData?.total || 0) + (casesData?.total || 0),
      page,
      pageSize,
      totalPages: Math.ceil(((articlesData?.total || 0) + (casesData?.total || 0)) / pageSize),
    }
  }, [filters.type, articlesData, casesData, page, pageSize])

  const isLoading = (filters.type === '__all__' || filters.type === 'article') && articlesLoading ||
    (filters.type === '__all__' || filters.type === 'case') && casesLoading

  // URL-based asset manager opening removed - assets are now opened via modal from AdminContentTable

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newFilters.search !== undefined) {
      if (newFilters.search) params.set('search', newFilters.search)
      else params.delete('search')
    }
    if (newFilters.type !== undefined) {
      if (newFilters.type !== '__all__') params.set('type', newFilters.type)
      else params.delete('type')
    }
    if (newFilters.status !== undefined) {
      if (newFilters.status !== '__all__') params.set('status', newFilters.status)
      else params.delete('status')
    }
    if (newFilters.arena !== undefined) {
      if (newFilters.arena) params.set('arena', newFilters.arena)
      else params.delete('arena')
    }
    if (newFilters.competency !== undefined) {
      if (newFilters.competency) params.set('competency', newFilters.competency)
      else params.delete('competency')
    }
    // Reset to page 1 when filters change
    params.delete('page')
    router.push(`/admin/content?${params.toString()}`, { scroll: false })
  }

  const updatePagination = (newPage: number, newPageSize?: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    if (newPageSize) params.set('pageSize', newPageSize.toString())
    router.push(`/admin/content?${params.toString()}`, { scroll: false })
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-content'] })
  }

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === contentData.items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(contentData.items.map((item) => item.id)))
    }
  }

  const handleBulkStatusChange = async (status: string) => {
    if (selectedItems.size === 0) return

    const selectedIds = Array.from(selectedItems)
    const selectedItemsData = contentData.items.filter((item) => selectedIds.includes(item.id))
    const hasArticles = selectedItemsData.some((item) => item.type === 'article')
    const hasCases = selectedItemsData.some((item) => item.type === 'case')

    const type = hasArticles && hasCases ? 'both' : hasArticles ? 'article' : 'case'

    try {
      const response = await fetch('/api/content/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          type,
          status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      queryClient.invalidateQueries({ queryKey: ['admin-content'] })
      setSelectedItems(new Set())
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleTreeSelect = (type: 'arena' | 'competency', id: string | null) => {
    if (type === 'arena') {
      updateFilters({ ...filters, arena: id || undefined, competency: undefined })
    } else {
      updateFilters({ ...filters, competency: id || undefined, arena: undefined })
    }
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Tree Navigation - Compact */}
      <div className="w-56 border-r bg-white flex-shrink-0 overflow-hidden">
        <AdminTree
          competencies={competencies}
          articles={contentData.items.filter((i) => i.type === 'article')}
          cases={contentData.items.filter((i) => i.type === 'case')}
          selectedArena={filters.arena}
          selectedCompetency={filters.competency}
          onSelect={handleTreeSelect}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Overview & Filters */}
        <div className="px-6 py-4 bg-white border-b flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <AdminOverview
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 px-6 py-4 overflow-hidden">
          <AdminContentTable
            items={contentData.items}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onBulkStatusChange={handleBulkStatusChange}
            onOpenDetails={setDetailsItem}
            filters={filters}
            isLoading={isLoading}
            pagination={{
              page: contentData.page,
              pageSize: contentData.pageSize,
              total: contentData.total,
              totalPages: contentData.totalPages,
              onPageChange: updatePagination,
            }}
          />
        </div>
      </div>

      {/* Generate Button - Fixed */}
      <Button
        onClick={() => setGeneratePanelOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-40"
        size="lg"
      >
        <Sparkles className="h-5 w-5" />
      </Button>

      {/* Details Drawer */}
      <AdminDetailsDrawer item={detailsItem} open={!!detailsItem} onClose={() => setDetailsItem(null)} />

      {/* Generate Panel */}
      {generatePanelOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            onClick={() => setGeneratePanelOpen(false)}
          />
          <GeneratePanel open={generatePanelOpen} onClose={() => setGeneratePanelOpen(false)} />
        </div>
      )}

    </div>
  )
}

