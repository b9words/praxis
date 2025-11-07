'use client'

import PublicHeader from '@/components/layout/PublicHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackEvents } from '@/lib/analytics'
// Welcome email is now handled by automated email system - no import needed
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!acceptedTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to create an account.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
      },
    })

    if (error) {
      let errorMessage = error.message
      
      if (error.message.toLowerCase().includes('rate limit')) {
        errorMessage = 'Too many signup attempts. Please wait a few minutes and try again.'
      }
      else if (error.message.toLowerCase().includes('invalid') && error.message.toLowerCase().includes('email')) {
        errorMessage = 'Please enter a valid email address.'
      }
      
      setError(errorMessage)
      setLoading(false)
    } else {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setEmailSent(true)
        setLoading(false)
      } else {
        // Welcome email is now handled by automated email system via webhook
        // No need to send here - it will be triggered by the database webhook to /api/webhooks/db-trigger

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          trackEvents.userSignedUp(user.id, email)
        }
        
        router.push('/onboarding')
        router.refresh()
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="flex items-center justify-center bg-neutral-50 px-4 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-neutral-200">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-light text-center text-neutral-900 tracking-tight">Request Access</CardTitle>
                <CardDescription className="text-center text-neutral-600">
                  Create your account to access the proving ground
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  {emailSent ? (
                    <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-none">
                      <p className="font-medium mb-1 text-neutral-900">Verification Required</p>
                      <p className="text-sm">
                        A confirmation link has been sent to <strong>{email}</strong>. Verify your account, then authenticate to proceed.
                      </p>
                    </div>
                  ) : (
                    <>
                      {error && (
                        <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-none">
                          {error}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="johndoe"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
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
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Minimum 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="acceptTerms"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            required
                            className="mt-1 h-4 w-4 border-neutral-300 rounded text-neutral-900 focus:ring-neutral-900"
                          />
                          <Label htmlFor="acceptTerms" className="text-sm text-neutral-600 leading-relaxed cursor-pointer">
                            I have read and agree to the{' '}
                            <Link href="/legal/terms" className="text-neutral-700 hover:text-neutral-900 transition-colors underline" target="_blank">
                              Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link href="/legal/privacy" className="text-neutral-700 hover:text-neutral-900 transition-colors underline" target="_blank">
                              Privacy Policy
                            </Link>
                            .
                          </Label>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-none" disabled={loading}>
                    {loading ? 'Submitting request...' : 'Submit Request'}
                  </Button>
                  <p className="text-sm text-center text-neutral-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-neutral-700 hover:text-neutral-900 transition-colors relative">
                      Authenticate
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
