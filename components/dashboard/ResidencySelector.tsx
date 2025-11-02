'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Award, CheckCircle2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ResidencyOption {
  year: number
  title: string
  description: string
  domains: string[]
  unlocked: boolean
}

const RESIDENCIES: ResidencyOption[] = [
  {
    year: 1,
    title: 'Year 1: Business Acumen Core',
    description: 'Master the foundational frameworks of business decision-making',
    domains: ['Financial Acumen', 'GTM Strategy', 'Operations', 'People & Organization'],
    unlocked: true,
  },
  {
    year: 2,
    title: 'Year 2: Strategic Execution',
    description: 'Learn to think strategically and execute with precision',
    domains: ['Competitive Strategy', 'Global Expansion', 'Marketing & Brand'],
    unlocked: false,
  },
  {
    year: 3,
    title: 'Year 3: Deal Making',
    description: 'Navigate complex transactions and partnerships',
    domains: ['M&A Fundamentals', 'Deal Execution', 'Partnerships'],
    unlocked: false,
  },
  {
    year: 4,
    title: 'Year 4: Capital Leadership',
    description: 'Master capital allocation and investor relations',
    domains: ['Capital Allocation', 'Investor Relations'],
    unlocked: false,
  },
  {
    year: 5,
    title: 'Year 5: Executive Leadership',
    description: 'Lead through crisis and govern with wisdom',
    domains: ['Crisis Leadership', 'Corporate Governance'],
    unlocked: false,
  },
]

interface ResidencySelectorProps {
  currentResidency?: number
  userId: string
}

export default function ResidencySelector({ currentResidency, userId }: ResidencySelectorProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const updateResidencyMutation = useMutation({
    mutationFn: (year: number) =>
      fetchJson('/api/residency', {
        method: 'PUT',
        body: { currentResidency: year },
      }),
    onSuccess: (_, year) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.progress() })
      toast.success(`Welcome to ${RESIDENCIES[year - 1].title}!`)
      
      // Cookie is already set by API route in response headers
      // Set client-side cookie as backup
      document.cookie = `onboarding_complete=1; path=/; max-age=30; SameSite=Lax`
      
      // Redirect - API route set cookie in response, this ensures it's available
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to select residency')
    },
  })

  const handleSelect = (year: number) => {
    if (!RESIDENCIES[year - 1].unlocked) {
      toast.error('This residency is locked. Complete the previous year first.')
      return
    }
    updateResidencyMutation.mutate(year)
  }

  const selecting = updateResidencyMutation.isPending

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {RESIDENCIES.map((residency) => {
          const isSelected = currentResidency === residency.year
          const isLocked = !residency.unlocked

          return (
            <div
              key={residency.year}
              className={`bg-white border transition-colors relative ${
                isSelected
                  ? 'border-gray-900'
                  : isLocked
                  ? 'border-gray-200 opacity-60'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-3 -right-3">
                  <Badge className="bg-gray-900 text-white text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Current
                  </Badge>
                </div>
              )}

              {isLocked && (
                <div className="absolute -top-3 -right-3">
                  <Badge variant="outline" className="text-xs font-medium text-gray-600 border-gray-300">
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`
                    h-12 w-12 border flex items-center justify-center font-semibold text-lg
                    ${isLocked ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-white border-gray-300 text-gray-900'}
                  `}>
                    {residency.year}
                  </div>
                  <Award className={`h-5 w-5 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">{residency.title}</h3>
                <p className="text-xs text-gray-500 mb-4">{residency.description}</p>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Domains:</p>
                  <div className="flex flex-wrap gap-1">
                    {residency.domains.map((domain) => (
                      <Badge key={domain} variant="outline" className="text-xs font-medium text-gray-600 border-gray-300">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleSelect(residency.year)}
                  disabled={isLocked || selecting || isSelected}
                  className={`w-full rounded-none ${
                    isSelected 
                      ? 'border-gray-300 hover:border-gray-400' 
                      : isLocked
                      ? 'bg-gray-400 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                  variant={isSelected ? 'outline' : 'default'}
                >
                  {isLocked ? 'Locked' : isSelected ? 'Current Path' : 'Select Path'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
