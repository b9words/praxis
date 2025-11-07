'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Users, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function WaitlistClientPage({ initialWaitlistCount, initialIsOnWaitlist }: { initialWaitlistCount: number; initialIsOnWaitlist: boolean }) {
  const [isOnWaitlist, setIsOnWaitlist] = useState(initialIsOnWaitlist)
  const [waitlistCount, setWaitlistCount] = useState(initialWaitlistCount)
  const [isLoading, setIsLoading] = useState(false)
  const progressPercentage = Math.min(100, (waitlistCount / 100) * 100)

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/community/waitlist', { method: 'POST' })
      if (res.status === 201) {
        toast.success("You're on the list! We'll notify you when the doors open.")
        setIsOnWaitlist(true)
        setWaitlistCount((c) => c + 1)
      } else if (res.status === 200) {
        toast.info('You are already on the waitlist')
        setIsOnWaitlist(true)
      } else {
        throw new Error('Failed to join the waitlist')
      }
    } catch (e: any) {
      toast.error(e?.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400"><Users className="h-full w-full" /></div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">The Praxis Network is Being Forged.</h1>
        <p className="mt-4 text-lg text-gray-600">Connect with a private, curated community of ambitious operators and entrepreneurs. Membership is currently being formed and will open exclusively to the first 100 leaders.</p>
        <div className="w-full bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Founding Member Progress</h3>
          <Progress value={progressPercentage} className="w-full h-2 mb-2" />
          <div className="flex justify-between text-sm font-medium text-gray-700">
            <span>{waitlistCount} Leaders</span>
            <span>100 Founding Members</span>
          </div>
        </div>
        {isOnWaitlist ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">You are on the Founding 100 Waitlist.</p>
          </div>
        ) : (
          <Button onClick={handleJoin} disabled={isLoading} size="lg" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none py-6 text-lg">
            {isLoading ? 'Joining...' : 'Join the Founding 100 Waitlist'}
          </Button>
        )}
        <p className="text-xs text-gray-500">Founding Members will receive exclusive access, a permanent 'Founder' status, and will help shape the future of the community.</p>
      </div>
    </div>
  )
}


