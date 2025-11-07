'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Award } from 'lucide-react'
import Link from 'next/link'

interface DomainCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  domainTitle: string
  certificateUrl: string
}

export default function DomainCompletionModal({
  isOpen,
  onClose,
  domainTitle,
  certificateUrl,
}: DomainCompletionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="space-y-4">
          <Award className="mx-auto h-12 w-12 text-yellow-500" />
          <DialogTitle className="text-2xl font-bold">Domain Complete!</DialogTitle>
          <DialogDescription>
            Congratulations! You have mastered the core competencies of{' '}
            <span className="font-semibold text-gray-900">{domainTitle}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-col gap-4">
          <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
            <Link href={certificateUrl}>View Your Certificate</Link>
          </Button>
          <Button variant="outline" onClick={onClose}>
            Continue Learning
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


