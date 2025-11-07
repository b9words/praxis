'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LedgerHero() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      toast.success('Successfully subscribed to The CEO\'s Ledger!')
      setEmail('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="mb-20 relative">
        <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
        <h1 className="text-5xl md:text-6xl font-light text-neutral-900 leading-tight tracking-tight">
          The CEO's Ledger.
        </h1>
      </div>
      
      <p className="text-lg text-neutral-700 leading-relaxed">
        A weekly, high-signal analysis of business strategy and capital allocation, delivered to your inbox. Free. Forever.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
          className="flex-1 rounded-none border-neutral-300 focus:border-neutral-900 h-12 text-base"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none px-8 h-12 text-sm font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    </div>
  )
}


