'use client'

import PublicHeader from '@/components/layout/PublicHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(redirectTo)
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
                <CardTitle className="text-2xl font-light text-center text-neutral-900 tracking-tight">Access the Proving Ground</CardTitle>
                <CardDescription className="text-center text-neutral-600">
                  Authenticate to access your analytical workspace
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-none">
                      {error}
                    </div>
                  )}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-none"
                    />
                  </div>
                  <div className="text-right">
                    <Link href="/reset-password" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors relative">
                      Reset Access Protocol
                      <span className="absolute -bottom-0.5 left-0 w-0 h-[0.5px] bg-neutral-900 transition-all duration-300 hover:w-full"></span>
                    </Link>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-none" disabled={loading}>
                    {loading ? 'Authenticating...' : 'Authenticate'}
                  </Button>
                  <p className="text-sm text-center text-neutral-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-neutral-700 hover:text-neutral-900 transition-colors relative">
                      Request Access
                      <span className="absolute -bottom-0.5 left-0 w-0 h-[0.5px] bg-neutral-900 transition-all duration-300 hover:w-full"></span>
                    </Link>
                  </p>
                  <p className="text-xs text-center text-neutral-500">
                    Having trouble authenticating? Check your email for a verification link if you just signed up.
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
