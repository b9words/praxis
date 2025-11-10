'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ThumbsUp, User, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import MarkdownRenderer from '@/components/ui/Markdown'
import { useState } from 'react'
import { toast } from 'sonner'

interface CommunityResponsesProps {
  caseId: string
  userId?: string
}

interface Response {
  id: string
  content: string
  isPublic: boolean
  likesCount: number
  createdAt: string
  user: {
    id: string
    username: string
    fullName: string | null
    avatarUrl: string | null
  }
  likes: Array<{ userId: string }>
}

export default function CommunityResponses({ caseId, userId }: CommunityResponsesProps) {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Fetch public responses
  const { data: responsesData, isLoading } = useQuery({
    queryKey: ['case-responses', caseId],
    queryFn: () =>
      fetchJson<{ items: Response[]; nextCursor: string | null; hasNextPage: boolean }>(
        `/api/case-studies/${caseId}/responses?limit=20`
      ),
  })

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ responseId, liked }: { responseId: string; liked: boolean }) => {
      if (liked) {
        return fetchJson(`/api/case-studies/responses/${responseId}/like`, {
          method: 'DELETE',
        })
      } else {
        return fetchJson(`/api/case-studies/responses/${responseId}/like`, {
          method: 'POST',
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-responses', caseId] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update like')
    },
  })

  const handleToggleLike = (response: Response) => {
    if (!userId) {
      toast.error('Please log in to like responses')
      return
    }

    const hasLiked = response.likes.some(like => like.userId === userId)
    toggleLikeMutation.mutate({ responseId: response.id, liked: hasLiked })
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <p className="text-sm text-gray-600">Loading community responses...</p>
      </div>
    )
  }

  if (!responsesData || responsesData.items.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 mb-6">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-medium text-gray-900">Community Responses</h2>
        <p className="text-sm text-gray-600 mt-1">
          See how others approached this case study
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {responsesData.items.map((response) => {
          const hasLiked = userId ? response.likes.some(like => like.userId === userId) : false
          const isExpanded = expandedId === response.id
          const previewLength = 300
          const needsTruncation = response.content.length > previewLength

          return (
            <div key={response.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {response.user.avatarUrl ? (
                      <img
                        src={response.user.avatarUrl}
                        alt={response.user.username}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {response.user.fullName || response.user.username}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleLike(response)}
                  disabled={!userId || toggleLikeMutation.isPending}
                  className={`flex items-center gap-2 ${
                    hasLiked ? 'border-blue-500 bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <ThumbsUp className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                  <span>{response.likesCount}</span>
                </Button>
              </div>

              <div className="mt-4">
                {isExpanded || !needsTruncation ? (
                  <div className="prose prose-sm max-w-none">
                    <MarkdownRenderer content={response.content} />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <MarkdownRenderer content={response.content.substring(0, previewLength) + '...'} />
                  </div>
                )}
                {needsTruncation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : response.id)}
                    className="mt-2 text-xs"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {responsesData.hasNextPage && (
        <div className="p-4 border-t border-gray-200 text-center">
          <Button variant="outline" size="sm" className="rounded-none">
            Load more responses
          </Button>
        </div>
      )}
    </div>
  )
}

