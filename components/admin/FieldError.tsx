'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FieldErrorProps {
  error?: string
  className?: string
}

export default function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null

  return (
    <Alert className={`border-red-200 bg-red-50 mt-1 ${className || ''}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
        <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
      </div>
    </Alert>
  )
}

