'use client'

import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface ProgressIndicatorProps {
  isCompleted: boolean
  size?: 'sm' | 'md'
}

export default function ProgressIndicator({ 
  isCompleted, 
  size = 'md' 
}: ProgressIndicatorProps) {
  if (!isCompleted) return null

  return (
    <Badge 
      variant="outline" 
      className="bg-green-50 text-green-700 border-green-300 gap-1"
    >
      <Check className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>Completed</span>
    </Badge>
  )
}

