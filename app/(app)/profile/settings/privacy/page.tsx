'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  isPublic: boolean
}

export default function PrivacySettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Fetch profile
  const { data, isLoading } = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: ({ signal }) => fetchJson<{ profile: Profile }>('/api/auth/profile', { signal }),
  })

  const profile = data?.profile

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: (isPublic: boolean) =>
      fetchJson<{ profile: Profile }>(`/api/profiles/${profile?.id}`, {
        method: 'PUT',
        body: { isPublic },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'current'] })
      toast.success('Profile visibility updated')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update visibility')
    },
  })

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: () => fetchJson<{ data: any; filename: string }>('/api/profile/settings/privacy/export', { method: 'POST' }),
    onSuccess: async (response) => {
      if (response.data && response.filename) {
        // Create and download JSON file
        const jsonString = JSON.stringify(response.data, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = response.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Data exported successfully')
      } else {
        toast.error('Export failed')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export data')
    },
  })

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => fetchJson('/api/profile/settings/privacy/delete', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Account deletion requested')
      // Redirect to home page
      router.push('/')
      // Clear all client-side state
      queryClient.clear()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-base font-medium text-gray-900 mb-2">Profile not found</p>
        </div>
      </div>
    )
  }

  const canDelete = deleteConfirmText === 'DELETE'

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Security & Privacy Controls</h1>
      </div>

      <div className="space-y-6">
        {/* Profile Visibility */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Profile Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="isPublic" className="text-base">Public Profile</Label>
                <CardDescription>
                  When enabled, your Profile (including your competency matrix and engagement history) will be visible to anyone with the link. When disabled, it is private and only visible to you.
                </CardDescription>
              </div>
              <Switch
                id="isPublic"
                checked={profile.isPublic}
                onCheckedChange={(checked) => {
                  updateVisibilityMutation.mutate(checked)
                }}
                disabled={updateVisibilityMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Data */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Export My Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download a JSON file containing all of your profile information and simulation history.
                </p>
              </div>
              <Button
                onClick={() => exportDataMutation.mutate()}
                disabled={exportDataMutation.isPending}
                variant="outline"
                className="border-gray-300 hover:border-gray-400 rounded-none"
              >
                {exportDataMutation.isPending ? 'Exporting...' : 'Export My Data'}
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              {/* Delete Account */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Request Account Deletion</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    This will permanently delete your account and all associated data. This action is irreversible.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 rounded-none"
                    >
                      Request Account Deletion
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          This action cannot be undone. This will permanently delete your account and all associated data, including:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Your profile</li>
                          <li>All simulation history and debriefs</li>
                          <li>All progress and competency scores</li>
                        </ul>
                        <p className="pt-2">
                          To confirm, type <strong>DELETE</strong> in the field below:
                        </p>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="mt-2 rounded-none"
                        />
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (canDelete) {
                            deleteAccountMutation.mutate()
                          }
                        }}
                        disabled={!canDelete || deleteAccountMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-none"
                      >
                        {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

