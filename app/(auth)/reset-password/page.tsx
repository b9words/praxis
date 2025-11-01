'use client'

import PublicHeader from '@/components/layout/PublicHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const supabase = createClient()

    if (code) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: code,
        type: 'recovery',
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="flex items-center justify-center bg-neutral-50 px-4 py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
            <div className="flex justify-center">
              <Card className="w-full max-w-md border-neutral-200">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-light text-center text-neutral-900 tracking-tight">Access Protocol Updated</CardTitle>
                  <CardDescription className="text-center text-neutral-600">
                    Your password has been reset. Redirecting to authentication...
                  </CardDescription>
                </CardHeader>
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
      <div className="flex items-center justify-center bg-neutral-50 px-4 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-neutral-200">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-light text-center text-neutral-900 tracking-tight">Reset Access Protocol</CardTitle>
                <CardDescription className="text-center text-neutral-600">
                  Define your new authentication credentials
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleReset}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-none">
                      {error}
                    </div>
                  )}
                  {!code && (
                    <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-none">
                      Use the reset link provided in your email to proceed.
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
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
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="rounded-none"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-none" disabled={loading}>
                    {loading ? 'Updating access protocol...' : 'Update Access Protocol'}
                  </Button>
                  <p className="text-sm text-center text-neutral-600">
                    Remember your credentials?{' '}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingState type="dashboard" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
