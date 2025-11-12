'use client'

import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineCheckProps {
  items: string[]
  correctIndices?: number[]
  onComplete?: () => void
}

export default function InlineCheck({ 
  items, 
  correctIndices = [],
  onComplete 
}: InlineCheckProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [isComplete, setIsComplete] = useState(false)

  const handleToggle = (index: number) => {
    if (isComplete) return
    
    const newSelected = new Set(selectedIndices)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIndices(newSelected)

    // Check if all correct items are selected
    if (correctIndices.length > 0) {
      const allCorrectSelected = correctIndices.every(idx => newSelected.has(idx))
      const noIncorrectSelected = Array.from(newSelected).every(idx => correctIndices.includes(idx))
      
      if (allCorrectSelected && noIncorrectSelected && newSelected.size === correctIndices.length) {
        setIsComplete(true)
        onComplete?.()
      }
    }
  }

  const isCorrect = (index: number) => {
    if (!isComplete || correctIndices.length === 0) return null
    return correctIndices.includes(index)
  }

  const isSelected = (index: number) => selectedIndices.has(index)

  return (
    <div className="my-6 p-4 border border-neutral-200 bg-neutral-50">
      <div className="mb-3">
        <p className="text-sm font-medium text-neutral-900 mb-1">Check your understanding</p>
        <p className="text-xs text-neutral-600">Select all that apply</p>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => {
          const selected = isSelected(index)
          const correct = isCorrect(index)
          
          return (
            <button
              key={index}
              onClick={() => handleToggle(index)}
              disabled={isComplete}
              className={cn(
                "w-full text-left p-3 border rounded transition-colors",
                "hover:bg-white disabled:cursor-default",
                selected && !isComplete && "border-neutral-900 bg-white",
                isComplete && correct === true && "border-green-600 bg-green-50",
                isComplete && correct === false && selected && "border-red-300 bg-red-50",
                !selected && !isComplete && "border-neutral-300 bg-white"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {isComplete ? (
                    correct ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : selected ? (
                      <Circle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-neutral-300" />
                    )
                  ) : (
                    <Circle className={cn(
                      "h-4 w-4",
                      selected ? "text-neutral-900" : "text-neutral-300"
                    )} />
                  )}
                </div>
                <span className={cn(
                  "text-sm flex-1",
                  isComplete && correct === false && selected && "text-red-700",
                  isComplete && correct === true && "text-green-800",
                  !isComplete && selected && "text-neutral-900 font-medium",
                  !isComplete && !selected && "text-neutral-700"
                )}>
                  {item}
                </span>
              </div>
            </button>
          )
        })}
      </div>
      {isComplete && correctIndices.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <p className="text-xs text-green-700 font-medium">✓ All correct!</p>
        </div>
      )}
    </div>
  )
}

