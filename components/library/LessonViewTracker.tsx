'use client'

import { trackEvents } from '@/lib/analytics'
import { useEffect } from 'react'

interface LessonViewTrackerProps {
  lessonId: string
  domainId: string
  moduleId: string
  userId: string | null
}

/**
 * Client component to track lesson view analytics
 * Must be used in a client component or as a child of server component
 */
export default function LessonViewTracker({
  lessonId,
  domainId,
  moduleId,
  userId,
}: LessonViewTrackerProps) {
  useEffect(() => {
    if (userId) {
      // Track lesson view
      trackEvents.lessonViewed(lessonId, domainId, moduleId, userId)
    }
  }, [lessonId, domainId, moduleId, userId])

  return null // This component doesn't render anything
}

