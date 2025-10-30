'use client'

import { toggleBookmark } from '@/app/actions/progress'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface BookmarkButtonProps {
  domainId: string
  moduleId: string
  lessonId: string
  initialBookmarked: boolean
}

export default function BookmarkButton({
  domainId,
  moduleId,
  lessonId,
  initialBookmarked
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async () => {
    // Optimistic update
    const previousBookmarked = bookmarked
    setBookmarked(!previousBookmarked)
    setIsToggling(true)
    
    try {
      const result = await toggleBookmark(domainId, moduleId, lessonId, !previousBookmarked)
      if (!result.success) {
        // Rollback on error
        setBookmarked(previousBookmarked)
        toast.error('Failed to update bookmark')
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      // Rollback on error
      setBookmarked(previousBookmarked)
      toast.error('Failed to update bookmark')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isToggling}
      className="h-8 px-2.5 text-neutral-600 hover:text-yellow-600 hover:bg-yellow-50"
      title="Save for future analysis"
    >
      <Star 
        className={`h-4 w-4 ${bookmarked ? 'text-yellow-500 fill-yellow-500' : ''}`} 
      />
    </Button>
  )
}

