'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Newsletter {
  id: string
  subject: string
  summary: string | null
  publishedAt: string | null
  name: string | null
}

export default function LedgerArchive() {
  const { data, isLoading } = useQuery<{ newsletters: Newsletter[] }>({
    queryKey: ['newsletters'],
    queryFn: () => fetchJson('/api/newsletters'),
  })

  const newsletters = data?.newsletters || []

  return (
    <div className="max-w-4xl space-y-6">
      <div className="mb-20 relative">
        <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
        <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">The Archive</h2>
        <p className="text-base text-neutral-600">
          Past editions of The CEO's Ledger, demonstrating the value of our weekly analysis.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : newsletters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-neutral-500">No newsletters published yet.</p>
          <p className="text-xs text-neutral-400 mt-1">Check back soon for our first edition.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {newsletters.map((newsletter) => (
            <div
              key={newsletter.id}
              className="border-b border-neutral-200 pb-6 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-neutral-900 mb-2">
                    {newsletter.name || newsletter.subject}
                  </h3>
                  {newsletter.summary && (
                    <p className="text-base text-neutral-600 leading-relaxed mb-3">
                      {newsletter.summary}
                    </p>
                  )}
                  {newsletter.publishedAt && (
                    <p className="text-sm text-neutral-500">
                      {format(new Date(newsletter.publishedAt), 'MMMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


