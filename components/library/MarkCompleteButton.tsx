'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Check, CheckCircle } from 'lucide-react'
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
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleToggle = async () => {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('user_article_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('article_id', articleId)

        if (error) throw error
        setIsCompleted(false)
        toast.success('Progress reset')
      } else {
        // Mark as complete
        const { error } = await supabase.from('user_article_progress').upsert({
          user_id: user.id,
          article_id: articleId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })

        if (error) throw error
        setIsCompleted(true)
        toast.success('Article marked as complete!')
      }

      router.refresh()
    } catch (error: any) {
      console.error('Error updating progress:', error)
      toast.error(error.message || 'Failed to update progress')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      variant={isCompleted ? 'outline' : 'default'}
      className="gap-2"
    >
      {isCompleted ? (
        <>
          <CheckCircle className="h-4 w-4" />
          Completed
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          Mark as Complete
        </>
      )}
    </Button>
  )
}

