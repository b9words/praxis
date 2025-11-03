'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PaddleCheckout from '@/components/pricing/PaddleCheckout'
import { Check, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type UpgradeContext = 
  | 'lesson'
  | 'case-study'
  | 'module'
  | 'curriculum'
  | 'debrief'
  | 'simulation'

interface UpgradeProps {
  /**
   * The context in which this upgrade component is displayed
   * Determines the primary unlock message and benefits shown
   */
  context: UpgradeContext
  
  /**
   * Optional custom headline to override the default context-based message
   */
  headline?: string
  
  /**
   * Optional custom description to provide context-specific details
   */
  description?: string
  
  /**
   * Custom benefits to display (if not provided, uses defaults based on context)
   */
  benefits?: string[]
  
  /**
   * Recommended plan ID (defaults to Professional plan)
   */
  recommendedPlanId?: string
  
  /**
   * Recommended plan name (defaults to 'Professional')
   */
  recommendedPlanName?: string
  
  /**
   * Show link to view all pricing plans instead of direct checkout
   */
  showPricingLink?: boolean
  
  /**
   * Custom className for the card container
   */
  className?: string
  
  /**
   * Variant: 'default' shows full feature list, 'compact' shows minimal benefits
   */
  variant?: 'default' | 'compact'
}

const DEFAULT_BENEFITS = {
  lesson: [
    'Access to full curriculum (52 articles, 14 cases)',
    'AI Study Assistant for all lessons',
    'Unlimited simulation attempts',
    'AI-powered performance debriefs',
    'Track progress across all content'
  ],
  'case-study': [
    'Complete this case study and see your scores',
    'Receive detailed AI-powered performance debrief',
    'Access all 14 case studies in the curriculum',
    'Unlimited attempts with personalized feedback',
    'Track competency development over time'
  ],
  module: [
    'Access all lessons in this module',
    'Complete the full learning path',
    'Practice with associated case studies',
    'Get AI-powered feedback and coaching',
  ],
  curriculum: [
    'Full access to 5-year curriculum (52 articles, 14 cases)',
    'AI Study Assistant for personalized learning',
    'Unlimited simulation attempts',
    'AI-powered performance debriefs',
    'Personal Execemy Profile & credentials'
  ],
  debrief: [
    'View your complete performance analysis',
    'See detailed competency scores',
    'Get AI-powered strategic feedback',
    'Compare against expert benchmarks',
    'Access historical debriefs'
  ],
  simulation: [
    'Complete all decision stages',
    'Unlock advanced simulation features',
    'Access AI role-play interactions',
    'Receive comprehensive performance debrief',
    'Save and resume simulations'
  ]
}

const DEFAULT_HEADLINES = {
  lesson: 'Unlock the Full Lesson',
  'case-study': 'Complete This Case Study',
  module: 'Unlock This Module',
  curriculum: 'Unlock the Full Curriculum',
  debrief: 'View Your Performance Debrief',
  simulation: 'Complete This Simulation'
}

const DEFAULT_DESCRIPTIONS = {
  lesson: 'Subscribe to access this lesson and unlock the complete curriculum.',
  'case-study': 'Subscribe to complete this case study and view your detailed performance analysis.',
  module: 'Subscribe to access all lessons in this module and the complete curriculum.',
  curriculum: 'Get full access to the 5-year curriculum with AI coaching and simulations.',
  debrief: 'Your performance analysis and competency scores are ready. Subscribe to view them.',
  simulation: 'Subscribe to complete all stages and receive your comprehensive performance debrief.'
}

export default function Upgrade({
  context,
  headline,
  description,
  benefits,
  recommendedPlanId = process.env.NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL || '',
  recommendedPlanName = 'Professional',
  showPricingLink = false,
  className,
  variant = 'default'
}: UpgradeProps) {
  const displayHeadline = headline || DEFAULT_HEADLINES[context]
  const displayDescription = description || DEFAULT_DESCRIPTIONS[context]
  const displayBenefits = benefits || DEFAULT_BENEFITS[context]

  return (
    <Card className={cn(
      'border-neutral-200 bg-white hover:border-neutral-300 transition-colors relative',
      'rounded-none border',
      className
    )}>
      <div className="absolute top-0 left-0 w-full h-[0.5px] bg-neutral-900 opacity-0 hover:opacity-20 transition-opacity"></div>
      
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Lock className="w-5 h-5 text-neutral-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-medium text-neutral-900 mb-2">
              {displayHeadline}
            </CardTitle>
            <CardDescription className="text-sm text-neutral-700 leading-relaxed">
              {displayDescription}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Benefits List */}
        {variant === 'default' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-900 mb-2">
              With a subscription, you'll get:
            </p>
            <ul className="space-y-2.5">
              {displayBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-neutral-700 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-700 leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Section */}
        <div className="pt-4 border-t border-neutral-200">
          {showPricingLink ? (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center w-full h-12 px-8 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-none transition-colors"
            >
              View Pricing Plans
            </Link>
          ) : recommendedPlanId ? (
            <PaddleCheckout
              planId={recommendedPlanId}
              planName={recommendedPlanName}
              className="w-full h-12 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-none"
            >
              Subscribe to {recommendedPlanName}
            </PaddleCheckout>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center w-full h-12 px-8 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-none transition-colors"
            >
              View Pricing Plans
            </Link>
          )}
          
          <p className="text-xs text-neutral-500 text-center mt-3">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

