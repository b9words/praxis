'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Fetch profile using API route
      const response = await fetch(`/api/profiles/${user.id}`)
      if (!response.ok) {
        toast.error('Failed to load profile')
        return
      }

      const data = await response.json()
      const profileData = data.profile

      setProfile(profileData)
      setUsername(profileData.username || '')
      setFullName(profileData.fullName || '')
      setBio(profileData.bio || '')
      setAvatarUrl(profileData.avatarUrl || '')
      setIsPublic(profileData.isPublic || false)
      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleSave = async () => {
    if (!userId) return

    setSaving(true)

    const response = await fetch(`/api/profiles/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        fullName,
        bio,
        avatarUrl,
        isPublic,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      toast.error(error.error || 'Failed to save profile')
      setSaving(false)
      return
    }

    toast.success('Profile updated successfully')
    setSaving(false)
    router.push(`/profile/${username}`)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-2 text-gray-600">Manage your Praxis profile settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your public profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a URL to an image for your avatar</p>
            </div>
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Your unique username (used in profile URLs)</p>
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">A brief description about you (max 500 characters)</p>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Public Profile</Label>
              <p className="text-sm text-gray-500">Make your profile and scores visible to others</p>
            </div>
            <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/profile/${profile.username}`)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !username}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
