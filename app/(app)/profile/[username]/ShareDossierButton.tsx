'use client'

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShareDossierButtonProps {
  username: string
}

export default function ShareDossierButton({ username }: ShareDossierButtonProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${username}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Praxis Dossier',
          text: 'View my Execemy Praxis Dossier',
          url,
        })
        toast.success('Dossier shared')
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url)
        toast.success('Dossier URL copied to clipboard')
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        // Fallback to clipboard if share fails
        try {
          await navigator.clipboard.writeText(url)
          toast.success('Dossier URL copied to clipboard')
        } catch (clipboardError) {
          toast.error('Failed to share dossier')
        }
      }
    }
  }

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className="border-gray-300 hover:border-gray-400 rounded-none"
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share Dossier
    </Button>
  )
}

