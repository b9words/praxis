'use client'

import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
import { useRef, useState } from 'react'

interface DomainCertificateProps {
  domainTitle: string
  userName: string
  completedAt: Date
  domainId: string
}

export default function DomainCertificate({
  domainTitle,
  userName,
  completedAt,
  domainId,
}: DomainCertificateProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const certificateRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = () => {
    // Use browser's print-to-PDF functionality
    window.print()
  }

  const handleDownloadPNG = async () => {
    if (!certificateRef.current) return

    setIsGenerating(true)
    try {
      // Dynamically import html2canvas only when needed
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `Execemy_Certificate_${domainId}_${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()

      setIsGenerating(false)
    } catch (error) {
      console.error('Error generating PNG:', error)
      // Fallback to print if html2canvas fails
      window.print()
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate: ${domainTitle}`,
          text: `I completed ${domainTitle} on Execemy!`,
          url,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url)
      alert('Certificate URL copied to clipboard!')
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Certificate */}
      <div
        ref={certificateRef}
        className="certificate-print bg-white border-4 border-blue-600 rounded-lg p-12 shadow-2xl"
        style={{ minHeight: '600px' }}
      >
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="border-b-2 border-gray-200 pb-6">
            <h1 className="text-5xl font-bold text-blue-900 mb-2">PRAXIS</h1>
            <p className="text-xl text-gray-600">Executive Education Platform</p>
          </div>

          {/* Certificate Text */}
          <div className="py-8 space-y-4">
            <p className="text-2xl text-gray-700">This is to certify that</p>
            <h2 className="text-4xl font-bold text-blue-900">{userName}</h2>
            <p className="text-xl text-gray-600">has successfully completed</p>
            <h3 className="text-3xl font-semibold text-gray-900 italic">
              {domainTitle}
            </h3>
          </div>

          {/* Date */}
          <div className="pt-6 border-t-2 border-gray-200">
            <p className="text-lg text-gray-600">
              Completed on {formatDate(completedAt)}
            </p>
          </div>

          {/* Seal/Signature Area */}
          <div className="flex justify-between items-end pt-8">
            <div className="text-center">
              <div className="w-32 h-32 border-4 border-blue-600 rounded-full mx-auto flex items-center justify-center">
                <span className="text-4xl">✓</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Verified</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">Execemy Platform</p>
              <p className="text-xs text-gray-600">Executive Education</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button
          onClick={handleDownloadPNG}
          disabled={isGenerating}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  )
}

