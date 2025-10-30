'use client'

import PublicHeader from '@/components/layout/PublicHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ApplyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [motivation, setMotivation] = useState('')
  const [background, setBackground] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Pre-fill email if user is logged in
  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
      }
    }
    loadUserData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          fullName: fullName || null,
          motivation,
          background: background || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit application')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="flex items-center justify-center bg-neutral-50 px-4 py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
            <div className="flex justify-center">
              <Card className="w-full max-w-md border-neutral-200">
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="text-2xl font-light text-neutral-900 tracking-tight">Application Under Review</CardTitle>
                  <CardDescription className="text-neutral-600">
                    Your application has been submitted for assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-none">
                    <p className="text-sm">
                      Our community is curated for analytical rigor. We are assessing your application for fit. You will be notified of the outcome via email within 48 hours.
                    </p>
                  </div>
                  <p className="text-sm text-neutral-600 text-center">
                    You may create an account now, or wait for approval confirmation before proceeding.
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button asChild className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-none">
                    <Link href="/signup">Create Account</Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full rounded-none">
                    <Link href="/">Go Home</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="flex items-center justify-center bg-neutral-50 px-4 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="flex justify-center">
            <Card className="w-full max-w-2xl border-neutral-200">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-light text-center text-neutral-900 tracking-tight">Request Access</CardTitle>
                <CardDescription className="text-center text-neutral-600">
                  Our community is curated for analytical rigor. Submit your application for review.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-none">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-none"
                    />
                    <p className="text-xs text-neutral-500">
                      We'll use this to notify you about your application status
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name (Optional)</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="rounded-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivation">
                      Why do you want to join Praxis Platform? *
                    </Label>
                    <Textarea
                      id="motivation"
                      placeholder="Share your motivation for joining. What are your goals? What do you hope to learn or achieve?"
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      required
                      minLength={50}
                      className="min-h-[120px] rounded-none"
                    />
                    <p className="text-xs text-neutral-500">
                      Minimum 50 characters. {motivation.length} / {Math.max(50, motivation.length)} characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background">
                      Background & Experience (Optional)
                    </Label>
                    <Textarea
                      id="background"
                      placeholder="Tell us about your professional background, entrepreneurial experience, or any relevant experience that might help us understand your application."
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="min-h-[100px] rounded-none"
                    />
                  </div>

                  <div className="bg-neutral-100 border border-neutral-200 px-4 py-3 rounded-none">
                    <p className="text-sm text-neutral-700">
                      <strong className="font-medium text-neutral-900">Note:</strong> Praxis Platform maintains a curated community focused on analytical rigor. 
                      We review applications to ensure fit. You will be notified of the outcome via email within 48 hours.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-none" disabled={loading || motivation.length < 50}>
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                  <p className="text-sm text-center text-neutral-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-neutral-700 hover:text-neutral-900 transition-colors relative">
                      Sign in
                      <span className="absolute -bottom-0.5 left-0 w-0 h-[0.5px] bg-neutral-900 transition-all duration-300 hover:w-full"></span>
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
