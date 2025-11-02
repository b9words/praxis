'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  requireConfirmation?: boolean
  confirmationText?: string
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  requireConfirmation = false,
  confirmationText = '',
}: ConfirmDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const isConfirmed = !requireConfirmation || confirmationInput === confirmationText

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm()
      setConfirmationInput('')
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireConfirmation && (
          <div className="my-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Type <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">{confirmationText}</code> to confirm:
            </label>
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={confirmationText}
              className="font-mono"
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmationInput('')}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

