'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

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

  const updateStatusMutation = useMutation({
    mutationFn: ({ applicationId, status, notes }: { applicationId: string; status: 'approved' | 'rejected'; notes: string | null }) =>
      fetchJson('/api/applications', {
        method: 'PATCH',
        body: {
          applicationId,
          status,
          notes,
        },
      }),
    onSuccess: () => {
      router.refresh()
      setSelectedApp(null)
      setReviewNotes('')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update application status')
    },
  })

  const handleStatusUpdate = (status: 'approved' | 'rejected') => {
    if (!selectedApp) return
    updateStatusMutation.mutate({
      applicationId: selectedApp.id,
      status,
      notes: reviewNotes || null,
    })
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-500">No applications found</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-gray-200">
        <div className="divide-y divide-gray-100">
          {applications.map((app) => (
            <div key={app.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-medium text-gray-900">
                      {app.fullName || app.user?.fullName || 'Anonymous'}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium border-gray-300 ${
                        app.status === 'approved'
                          ? 'text-gray-700'
                          : app.status === 'rejected'
                          ? 'text-gray-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {app.email}
                    {app.user?.username && ` • @${app.user.username}`}
                  </p>
                  <div className="space-y-2 mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Motivation:</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{app.motivation}</p>
                    </div>
                    {app.background && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Background:</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{app.background}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Applied: {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {app.reviewedAt && (
                      <span>Reviewed: {new Date(app.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                    {app.reviewer && (
                      <span>By: {app.reviewer.fullName || app.reviewer.username}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedApp(app)
                    setReviewNotes(app.notes || '')
                  }}
                  className="border-gray-300 hover:border-gray-400 rounded-none ml-4"
                >
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
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
                <p className="text-sm text-gray-600">{selectedApp.email}</p>
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
                  className="min-h-[100px] rounded-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedApp(null)}
              disabled={updateStatusMutation.isPending}
              className="border-gray-300 hover:border-gray-400 rounded-none"
            >
              Cancel
            </Button>
            {selectedApp?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updateStatusMutation.isPending}
                  className="border-gray-300 hover:border-gray-400 rounded-none"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updateStatusMutation.isPending}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-none"
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

