'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ErrorState from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Profile {
  id: string
  username: string | null
  fullName: string | null
  avatarUrl: string | null
  bio: string | null
  isPublic: boolean
}

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  // Get user ID from Supabase
  useEffect(() => {
    async function getUserId() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // All redirects removed
        return
      }
      setUserId(user.id)
    }
    getUserId()
  }, [supabase, router])

  // Fetch profile with React Query - use /api/auth/profile for self-reads
  const { data, isLoading: loading, error } = useQuery({
    queryKey: userId ? queryKeys.profiles.byId(userId) : ['profile', 'none'],
    queryFn: ({ signal }) => fetchJson<{ profile: Profile }>('/api/auth/profile', { signal }),
    enabled: !!userId,
    retry: 2,
  })

  // Initialize form from fetched profile
  useEffect(() => {
    if (data?.profile) {
      const profile = data.profile
      setUsername(profile.username || '')
      setFullName(profile.fullName || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatarUrl || '')
      setIsPublic(profile.isPublic || false)
    }
  }, [data])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updates: {
      username: string
      fullName: string
      bio: string
      avatarUrl: string
      isPublic: boolean
    }) =>
      fetchJson<{ profile: Profile }>(`/api/profiles/${userId}`, {
        method: 'PUT',
        body: updates,
      }),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.byId(userId!) })
      toast.success('Profile updated successfully')
      const { safeRedirectAfterMutation } = await import('@/lib/utils/redirect-helpers')
      await safeRedirectAfterMutation(router, `/profile/${variables.username}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile')
    },
  })

  const handleSave = () => {
    if (!userId || !username) return
    updateMutation.mutate({
      username,
      fullName,
      bio,
      avatarUrl,
      isPublic,
    })
  }

  const profile = data?.profile

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <LoadingState type="profile" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Failed to load profile"
          message="Unable to load your profile data. Please try again."
          error={error}
          onRetry={() => window.location.reload()}
          showBackToDashboard={true}
        />
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Update Dossier</h1>
        <p className="text-sm text-gray-600">Manage your profile settings</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
            <p className="text-xs text-gray-500 mt-1">Update your public profile details</p>
          </div>
          <div className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">{username?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-1 rounded-none"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a URL to an image for your avatar</p>
            </div>
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Handle (@username)</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 rounded-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">This is your unique identifier and part of your public profile URL.</p>
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 rounded-none"
            />
          </div>

          {/* Executive Summary */}
          <div>
            <Label htmlFor="bio">Executive Summary</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A brief, one-line professional summary for your public dossier..."
              rows={3}
              className="mt-1 rounded-none"
            />
            <p className="text-xs text-gray-500 mt-1">A brief, one-line professional summary for your public dossier.</p>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 border border-gray-200">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Profile Visibility: {isPublic ? 'Public' : 'Classified'}</Label>
              <p className="text-xs text-gray-500">A public dossier can be shared as a signal of your demonstrated acumen.</p>
            </div>
            <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => router.push(`/profile/${profile?.username}`)} className="border-gray-300 hover:border-gray-400 rounded-none">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || !username} className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}