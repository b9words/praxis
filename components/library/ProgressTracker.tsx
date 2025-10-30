'use client'

import { markLessonAsCompleted, saveLessonProgress } from '@/app/actions/progress'
import { trackEvents } from '@/lib/analytics'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface ProgressTrackerProps {
  userId: string
  domainId: string
  moduleId: string
  lessonId: string
  initialProgress?: number
  initialStatus?: 'not_started' | 'in_progress' | 'completed'
  initialTimeSpent?: number
  initialScrollPosition?: number
}

export default function ProgressTracker({
  userId,
  domainId,
  moduleId,
  lessonId,
  initialProgress = 0,
  initialStatus = 'not_started',
  initialTimeSpent = 0,
  initialScrollPosition
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState(initialProgress)
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>(initialStatus)
  const [timeSpent, setTimeSpent] = useState(initialTimeSpent)
  const [isSaving, setIsSaving] = useState(false)
  const [failureCount, setFailureCount] = useState(0)
  const [isDisabled, setIsDisabled] = useState(false)
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const lastSaveTimeRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Circuit breaker: disable progress tracking after 3 consecutive failures
  const MAX_FAILURES = 3

  const saveProgress = useCallback(async (
    progressValue: number,
    statusValue: 'not_started' | 'in_progress' | 'completed',
    timeValue?: number
  ) => {
    if (isSaving || isDisabled) return

    setIsSaving(true)
    
    try {
      const result = await saveLessonProgress({
        domainId,
        moduleId,
        lessonId,
        status: statusValue,
        progressPercentage: progressValue,
        timeSpentSeconds: timeValue ? Math.round(timeValue) : undefined,
        lastReadPosition: {
          scrollTop: window.scrollY,
          timestamp: Date.now()
        }
      })
      
      // Reset failure count on success
      if (result.success && result.data) {
        setFailureCount(0)
      } else if (!result.success) {
        // Increment failure count
        const newFailureCount = failureCount + 1
        setFailureCount(newFailureCount)
        
        // Disable after max failures
        if (newFailureCount >= MAX_FAILURES) {
          setIsDisabled(true)
          console.debug('Progress tracking disabled after repeated failures')
        }
      }
    } catch (error) {
      // Increment failure count on error
      const newFailureCount = failureCount + 1
      setFailureCount(newFailureCount)
      
      // Disable after max failures
      if (newFailureCount >= MAX_FAILURES) {
        setIsDisabled(true)
        console.debug('Progress tracking disabled after repeated failures')
      } else {
        console.debug('Progress save failed (this is normal for users without profiles):', error)
      }
    } finally {
      setIsSaving(false)
    }
  }, [domainId, moduleId, lessonId, isSaving, isDisabled, failureCount])

  const handleComplete = useCallback(async () => {
    if (status === 'completed') return

    try {
      const result = await markLessonAsCompleted(domainId, moduleId, lessonId)
      if (result.success) {
        setStatus('completed')
        setProgress(100)
        
        // Track lesson completion
        trackEvents.lessonCompleted(lessonId, domainId, moduleId, userId)
      } else {
        toast.error('Failed to mark lesson as completed')
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error)
      toast.error('Failed to mark lesson as completed')
    }
  }, [domainId, moduleId, lessonId, status, userId])

  // Calculate scroll progress
  useEffect(() => {
    // Initialize timing on client side to avoid hydration issues
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now()
      lastSaveTimeRef.current = Date.now()
    }

    const calculateProgress = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      
      const scrollableHeight = documentHeight - windowHeight
      if (scrollableHeight <= 0) return 0
      
      const scrollProgress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100))
      return Math.round(scrollProgress)
    }

    const handleScroll = () => {
      const newProgress = calculateProgress()
      setProgress((prev) => {
        // Auto-complete if scrolled 80%+ and reading for 2+ minutes
        if (newProgress >= 80 && status !== 'completed') {
          const timeReading = (Date.now() - startTimeRef.current) / 1000
          if (timeReading >= 120) {
            // Auto-mark as completed
            handleComplete()
          } else if (status === 'not_started') {
            setStatus('in_progress')
          }
        } else if (newProgress > 0 && status === 'not_started') {
          setStatus('in_progress')
        }
        return newProgress
      })

      // Debounce save (save every 3 seconds)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(newProgress, 'in_progress')
      }, 3000)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial calculation
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [status, saveProgress, handleComplete])

  // Track reading time
  useEffect(() => {
    // Update time spent every 10 seconds
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const currentProgress = progress
      const currentStatus = status
      const newTimeSpent = initialTimeSpent + elapsed

      // Only save if at least 10 seconds have passed since last save
      if (Date.now() - lastSaveTimeRef.current >= 10000) {
        setTimeSpent(newTimeSpent)
        saveProgress(currentProgress, currentStatus, newTimeSpent)
        lastSaveTimeRef.current = Date.now()
      }
    }, 10000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [progress, status, initialTimeSpent, saveProgress])

  // Save progress on unmount
  useEffect(() => {
    return () => {
      const currentStatus = status
      const currentProgress = progress
      if (currentStatus !== 'completed') {
        const finalTimeSpent = initialTimeSpent + (Date.now() - startTimeRef.current) / 1000
        saveProgress(currentProgress, currentStatus, finalTimeSpent)
      }
    }
  }, [status, progress, initialTimeSpent, saveProgress])

  // Resume reading position on mount if exists
  useEffect(() => {
    if (initialScrollPosition && initialScrollPosition > 0 && initialStatus === 'in_progress') {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo({ top: initialScrollPosition, behavior: 'smooth' })
      }, 500)
    } else if (initialProgress > 5 && initialStatus === 'in_progress') {
      // Fallback to percentage if scroll position not available
      setTimeout(() => {
        const targetScroll = (document.documentElement.scrollHeight - window.innerHeight) * (initialProgress / 100)
        window.scrollTo({ top: targetScroll, behavior: 'smooth' })
      }, 500)
    }
  }, [initialScrollPosition, initialProgress, initialStatus]) // Only run once on mount

  // Don't render anything visible, this is just for tracking
  return null
}

