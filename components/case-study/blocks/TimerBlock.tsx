'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCaseStudyStore } from '@/lib/case-study-store'
import { Clock, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TimerBlockProps {
  blockId: string
  title?: string
  durationMinutes: number
  autoStart?: boolean
  showControls?: boolean
  warningThreshold?: number // Minutes remaining to show warning
}

export default function TimerBlock({
  blockId,
  title = 'Challenge Timer',
  durationMinutes,
  autoStart = false,
  showControls = true,
  warningThreshold = 5
}: TimerBlockProps) {
  const { getBlockState, updateBlockState, currentStageId } = useCaseStudyStore()
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60) // Convert to seconds
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isExpired, setIsExpired] = useState(false)

  // Load existing timer state
  useEffect(() => {
    if (currentStageId) {
      const blockState = getBlockState(currentStageId, blockId)
      if (blockState?.content) {
        setTimeRemaining(blockState.content.timeRemaining || durationMinutes * 60)
        setIsRunning(blockState.content.isRunning || false)
        setIsExpired(blockState.content.isExpired || false)
      }
    }
  }, [currentStageId, blockId, getBlockState, durationMinutes])

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1
          if (newTime <= 0) {
            setIsRunning(false)
            setIsExpired(true)
            return 0
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeRemaining])

  // Save timer state
  useEffect(() => {
    if (currentStageId) {
      updateBlockState(currentStageId, blockId, {
        content: {
          timeRemaining,
          isRunning,
          isExpired,
          durationMinutes,
          lastUpdated: new Date().toISOString()
        },
        isValid: true,
        lastUpdated: new Date().toISOString()
      })
    }
  }, [timeRemaining, isRunning, isExpired, currentStageId, blockId, updateBlockState, durationMinutes])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = (): string => {
    if (isExpired) return 'text-red-600'
    if (timeRemaining <= warningThreshold * 60) return 'text-orange-600'
    return 'text-neutral-900'
  }

  const getProgressPercentage = (): number => {
    const totalSeconds = durationMinutes * 60
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setTimeRemaining(durationMinutes * 60)
    setIsRunning(false)
    setIsExpired(false)
  }

  return (
    <Card className={`w-full ${isExpired ? 'border-red-200 bg-red-50' : timeRemaining <= warningThreshold * 60 ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${getTimeColor()}`}>
          <Clock className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className={isExpired ? 'text-red-700' : timeRemaining <= warningThreshold * 60 ? 'text-orange-700' : 'text-blue-700'}>
          {isExpired 
            ? 'Time has expired! Please submit your work.'
            : timeRemaining <= warningThreshold * 60
            ? `Warning: Only ${Math.ceil(timeRemaining / 60)} minutes remaining`
            : `You have ${durationMinutes} minutes to complete this challenge`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className={`text-6xl font-mono font-bold ${getTimeColor()}`}>
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-neutral-600 mt-2">
            {isExpired ? 'Expired' : isRunning ? 'Running' : 'Paused'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              isExpired ? 'bg-red-600' : 
              timeRemaining <= warningThreshold * 60 ? 'bg-orange-600' : 
              'bg-blue-600'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center justify-center gap-2">
            {!isRunning && !isExpired && (
              <Button
                onClick={handleStart}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            
            {isRunning && (
              <Button
                onClick={handlePause}
                size="sm"
                variant="outline"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            
            <Button
              onClick={handleReset}
              size="sm"
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {isExpired && (
          <div className="text-center p-3 bg-red-100 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">⏰ Time's Up!</p>
            <p className="text-red-600 text-sm mt-1">
              Please submit your current work. You can continue working, but your response will be marked as overtime.
            </p>
          </div>
        )}

        {timeRemaining <= warningThreshold * 60 && !isExpired && (
          <div className="text-center p-3 bg-orange-100 border border-orange-200 rounded-lg">
            <p className="text-orange-800 font-medium">⚠️ Time Warning</p>
            <p className="text-orange-600 text-sm mt-1">
              Less than {warningThreshold} minutes remaining. Consider wrapping up your analysis.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded">
          <strong>Timer Instructions:</strong> This timer helps you practice working under realistic time constraints. 
          In real business situations, you often need to make decisions quickly with incomplete information.
        </div>
      </CardContent>
    </Card>
  )
}
