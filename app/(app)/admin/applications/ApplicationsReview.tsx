'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Application {
  id: string
  email: string
  fullName: string | null
  motivation: string
  background: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: string | null
  reviewedAt: Date | null
  notes: string | null
  createdAt: Date
  user: {
    id: string
    username: string | null
    fullName: string | null
  } | null
  reviewer: {
    id: string
    username: string | null
    fullName: string | null
  } | null
}

interface ApplicationsReviewProps {
  applications: Application[]
}

export default function ApplicationsReview({ applications }: ApplicationsReviewProps) {
  const router = useRouter()
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!selectedApp) return

    setLoading(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          status,
          notes: reviewNotes || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update application status')
      }

      router.refresh()
      setSelectedApp(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update application status')
    } finally {
      setLoading(false)
    }
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          No applications found
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {app.fullName || app.user?.fullName || 'Anonymous'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {app.email}
                    {app.user?.username && ` • @${app.user.username}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      app.status === 'approved'
                        ? 'default'
                        : app.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {app.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedApp(app)
                      setReviewNotes(app.notes || '')
                    }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Motivation:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{app.motivation}</p>
                </div>
                {app.background && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Background:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{app.background}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                  {app.reviewedAt && (
                    <span>Reviewed: {new Date(app.reviewedAt).toLocaleDateString()}</span>
                  )}
                  {app.reviewer && (
                    <span>By: {app.reviewer.fullName || app.reviewer.username}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review {selectedApp?.fullName || selectedApp?.email}'s application
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Email:</p>
                <p className="text-sm">{selectedApp.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Motivation:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedApp.motivation}
                </p>
              </div>

              {selectedApp.background && (
                <div>
                  <p className="text-sm font-medium mb-1">Background:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedApp.background}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Review Notes (optional):</p>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this application..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedApp(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            {selectedApp?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={loading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

