'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvents } from '@/lib/analytics'
import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShareButtonsProps {
  simulationTitle: string
  scores: Record<string, number>
  profileUrl?: string
}

export default function ShareButtons({ simulationTitle, scores, profileUrl }: ShareButtonsProps) {
  const [copiedLink, setCopiedLink] = useState(false)

  const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length

  const shareText = `I just completed "${simulationTitle}" on Execemy and scored ${averageScore.toFixed(1)}/5! Building real business acumen through simulation. #ExecemyProgram`

  const handleCopyLink = () => {
    const url = profileUrl || window.location.origin + '/profile'
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    toast.success('Profile link copied!')
    setTimeout(() => setCopiedLink(false), 2000)
    
    // Track share event
    trackEvents.debriefShared(simulationTitle, 'link')
  }

  const handleShareLinkedIn = () => {
    const url = profileUrl || window.location.origin + '/profile'
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareText)}`
    window.open(linkedinUrl, '_blank', 'width=600,height=600')
    
    // Track share event
    trackEvents.debriefShared(simulationTitle, 'linkedin')
  }

  const handleShareTwitter = () => {
    const url = profileUrl || window.location.origin + '/profile'
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
    
    // Track share event
    trackEvents.debriefShared(simulationTitle, 'twitter')
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-blue-600" />
          <CardTitle>Share Your Achievement</CardTitle>
        </div>
        <CardDescription>
          Let others know about your progress on the Execemy journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={handleShareLinkedIn}
            className="bg-[#0077B5] hover:bg-[#006399] text-white"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </Button>

          <Button
            onClick={handleShareTwitter}
            className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Twitter
          </Button>

          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="gap-2"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

