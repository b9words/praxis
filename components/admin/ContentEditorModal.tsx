'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ContentEditor from '@/components/admin/ContentEditor'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContentEditorModalProps {
  open: boolean
  onClose: () => void
  contentType: 'article' | 'case'
  contentId: string
}

export default function ContentEditorModal({ open, onClose, contentType, contentId }: ContentEditorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Edit {contentType === 'article' ? 'Article' : 'Case'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ContentEditor 
            contentType={contentType} 
            mode="edit" 
            contentId={contentId}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}


