'use client'

import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface MarkCompleteButtonProps {
  articleId: string
  isCompleted: boolean
}

export default function MarkCompleteButton({
  articleId,
  isCompleted: initialCompleted,
}: MarkCompleteButtonProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCompleted, setIsCompleted] = useState(initialCompleted)

  const updateProgressMutation = useMutation({
    mutationFn: async ({ completed }: { completed: boolean }) => {
      if (completed) {
        return fetchJson('/api/progress/articles', {
          method: 'POST',
          body: { articleId, status: 'completed' },
        })
      } else {
        return fetchJson(`/api/progress/articles?articleId=${articleId}`, {
          method: 'DELETE',
        })
      }
    },
    onSuccess: (_, variables) => {
      setIsCompleted(variables.completed)
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.articles() })
      if (variables.completed) {
        toast.success('Article marked complete', {
          icon: <CheckCircle2 className="h-4 w-4" />,
        })
      } else {
        toast.success('Progress reset')
      }
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update progress')
    },
  })

  const handleToggle = () => {
    updateProgressMutation.mutate({ completed: !isCompleted })
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={updateProgressMutation.isPending}
      variant={isCompleted ? 'outline' : 'default'}
      className="gap-2"
    >
      {isCompleted ? (
        <>
          <CheckCircle className="h-4 w-4" />
          Marked complete
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          Mark complete
        </>
      )}
    </Button>
  )
}

