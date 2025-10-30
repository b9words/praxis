'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import Link from 'next/link'

export default function ApplicationPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Application Under Review</CardTitle>
          <CardDescription>
            Thank you for your interest in Praxis Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              We've received your application and our team is reviewing it. 
              You'll receive an email notification once your application has been processed.
            </p>
            <p className="text-sm text-gray-600">
              This typically takes 1-3 business days. We appreciate your patience!
            </p>
          </div>
          
          <div className="pt-4 space-y-3">
            <Button asChild className="w-full" variant="outline">
              <Link href="/apply">
                View My Application
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

