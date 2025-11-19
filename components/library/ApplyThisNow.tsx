'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Target } from 'lucide-react'
import Link from 'next/link'
import { analytics } from '@/lib/analytics'

interface ApplyThisNowProps {
  caseId: string
  caseTitle: string
  caseUrl: string
}

export default function ApplyThisNow({ caseId, caseTitle, caseUrl }: ApplyThisNowProps) {
  const handleClick = () => {
    analytics.track('apply_this_now_clicked', {
      caseId,
      caseTitle,
    })
  }

  return (
    <div className="my-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-none">
      <div className="flex items-start gap-4">
        <Target className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-medium text-purple-900 mb-2">
            Ready to apply this?
          </h3>
          <p className="text-sm text-purple-700 mb-4">
            Jump into the <strong>{caseTitle}</strong> Case Study to practice what you've learned.
          </p>
          <Button
            asChild
            onClick={handleClick}
            className="bg-purple-900 hover:bg-purple-800 text-white rounded-none"
          >
            <Link href={caseUrl}>
              Start Case Study
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


