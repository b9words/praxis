'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Award, CheckCircle2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
  const supabase = createClient()
  const [selecting, setSelecting] = useState(false)

  const handleSelect = async (year: number) => {
    if (!RESIDENCIES[year - 1].unlocked) {
      toast.error('This residency is locked. Complete the previous year first.')
      return
    }

    setSelecting(true)

    try {
      const { error } = await supabase
        .from('user_residency')
        .upsert({
          user_id: userId,
          current_residency: year,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success(`Welcome to ${RESIDENCIES[year - 1].title}!`)
      router.refresh()
    } catch (error) {
      console.error('Failed to select residency:', error)
      toast.error('Failed to select residency')
    } finally {
      setSelecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Choose Your Path</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select a residency to begin your structured learning journey. Each year builds on the previous,
          taking you from foundational concepts to executive-level decision-making.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {RESIDENCIES.map((residency) => {
          const isSelected = currentResidency === residency.year
          const isLocked = !residency.unlocked

          return (
            <Card
              key={residency.year}
              className={`relative transition-all ${
                isSelected
                  ? 'border-2 border-blue-500 shadow-lg'
                  : isLocked
                  ? 'opacity-60'
                  : 'hover:shadow-md hover:-translate-y-1'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-3 -right-3">
                  <Badge className="bg-blue-600 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Current
                  </Badge>
                </div>
              )}

              {isLocked && (
                <div className="absolute -top-3 -right-3">
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Locked
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`
                    h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl
                    ${isLocked ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}
                  `}>
                    {residency.year}
                  </div>
                  <Award className={`h-6 w-6 ${isLocked ? 'text-gray-400' : 'text-yellow-500'}`} />
                </div>
                <CardTitle className="text-xl">{residency.title}</CardTitle>
                <CardDescription>{residency.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Domains:</p>
                  <div className="flex flex-wrap gap-2">
                    {residency.domains.map((domain) => (
                      <Badge key={domain} variant="secondary" className="text-xs">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleSelect(residency.year)}
                  disabled={isLocked || selecting || isSelected}
                  className="w-full"
                  variant={isSelected ? 'outline' : 'default'}
                >
                  {isLocked ? 'Locked' : isSelected ? 'Current Path' : 'Select Path'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

