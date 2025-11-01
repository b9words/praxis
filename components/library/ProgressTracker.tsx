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

  // Use refs to track state without causing re-renders
  const isSavingRef = useRef(false)
  const isDisabledRef = useRef(false)
  const failureCountRef = useRef(0)

  const saveProgress = useCallback(async (
    progressValue: number,
    statusValue: 'not_started' | 'in_progress' | 'completed',
    timeValue?: number
  ) => {
    if (isSavingRef.current || isDisabledRef.current) return

    isSavingRef.current = true
    
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
        failureCountRef.current = 0
        setFailureCount(0)
      } else if (!result.success) {
        // Increment failure count
        const newFailureCount = failureCountRef.current + 1
        failureCountRef.current = newFailureCount
        setFailureCount(newFailureCount)
        
        // Disable after max failures
        if (newFailureCount >= MAX_FAILURES) {
          isDisabledRef.current = true
          setIsDisabled(true)
          console.debug('Progress tracking disabled after repeated failures')
        }
      }
    } catch (error) {
      // Increment failure count on error
      const newFailureCount = failureCountRef.current + 1
      failureCountRef.current = newFailureCount
      setFailureCount(newFailureCount)
      
      // Disable after max failures
      if (newFailureCount >= MAX_FAILURES) {
        isDisabledRef.current = true
        setIsDisabled(true)
        console.debug('Progress tracking disabled after repeated failures')
      } else {
        console.debug('Progress save failed (this is normal for users without profiles):', error)
      }
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [domainId, moduleId, lessonId])

  const statusRef = useRef<'not_started' | 'in_progress' | 'completed'>(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  const handleComplete = useCallback(async () => {
    if (statusRef.current === 'completed') return

    try {
      const result = await markLessonAsCompleted(domainId, moduleId, lessonId)
      if (result.success) {
        setStatus('completed')
        setProgress(100)
        statusRef.current = 'completed'
        
        // Track lesson completion
        trackEvents.lessonCompleted(lessonId, domainId, moduleId, userId)
      } else {
        toast.error('Failed to mark lesson as completed')
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error)
      toast.error('Failed to mark lesson as completed')
    }
  }, [domainId, moduleId, lessonId, userId])

  // Track last saved progress to avoid unnecessary saves
  const lastSavedProgressRef = useRef(initialProgress)

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

    let lastProgressValue = initialProgress

    const handleScroll = () => {
      const newProgress = calculateProgress()
      const currentStatus = statusRef.current
      
      // Only update state if progress changed significantly (5%)
      if (Math.abs(newProgress - lastProgressValue) >= 5) {
        setProgress((prev) => {
          // Auto-complete if scrolled 80%+ and reading for 2+ minutes
          if (newProgress >= 80 && currentStatus !== 'completed') {
            const timeReading = (Date.now() - startTimeRef.current) / 1000
            if (timeReading >= 120) {
              // Auto-mark as completed
              handleComplete()
            } else if (currentStatus === 'not_started') {
              setStatus('in_progress')
              statusRef.current = 'in_progress'
            }
          } else if (newProgress > 0 && currentStatus === 'not_started') {
            setStatus('in_progress')
            statusRef.current = 'in_progress'
          }
          lastProgressValue = newProgress
          return newProgress
        })

        // Debounce save (save every 5 seconds) - only if progress changed meaningfully from last saved
        if (Math.abs(newProgress - lastSavedProgressRef.current) >= 10) {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
          }

          saveTimeoutRef.current = setTimeout(() => {
            if (!isSavingRef.current && !isDisabledRef.current) {
              saveProgress(newProgress, statusRef.current)
              lastSavedProgressRef.current = newProgress
            }
          }, 5000) // Increased debounce to 5 seconds
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Don't trigger initial calculation - wait for actual scroll

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [saveProgress, handleComplete])

  // Track progress with ref to avoid dependency issues
  const progressRef = useRef(initialProgress)
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  // Track reading time
  useEffect(() => {
    // Update time spent every 30 seconds (reduced frequency)
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const currentProgress = progressRef.current
      const currentStatus = statusRef.current
      const newTimeSpent = initialTimeSpent + elapsed

      // Only save if at least 30 seconds have passed since last save
      if (Date.now() - lastSaveTimeRef.current >= 30000) {
        setTimeSpent(newTimeSpent)
        saveProgress(currentProgress, currentStatus, newTimeSpent)
        lastSaveTimeRef.current = Date.now()
      }
    }, 30000) // Check every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [initialTimeSpent, saveProgress])

  // Save progress on unmount - use refs to avoid dependency issues
  useEffect(() => {
    return () => {
      const currentStatus = statusRef.current
      const currentProgress = progressRef.current
      if (currentStatus !== 'completed' && !isDisabledRef.current && !isSavingRef.current) {
        const finalTimeSpent = initialTimeSpent + (Date.now() - startTimeRef.current) / 1000
        // Use a one-time save without await
        saveProgress(currentProgress, currentStatus, finalTimeSpent).catch(() => {
          // Silently fail on unmount
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

