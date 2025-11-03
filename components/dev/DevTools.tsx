'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()
  const router = useRouter()

  const isDev = process.env.NODE_ENV === 'development'

  // Fetch user
  const { data: userData } = useQuery({
    queryKey: ['dev', 'user'],
    queryFn: async ({ signal }) => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    retry: false,
    enabled: isDev,
  })

  const user = userData || null

  // Fetch profile - use /api/auth/profile for self-reads
  const { data: profileData } = useQuery({
    queryKey: user ? queryKeys.profiles.byId(user.id) : ['dev', 'profile', 'none'],
    queryFn: ({ signal }) =>
      fetchJson<{ profile: any }>('/api/auth/profile', { signal }),
    enabled: !!user && isDev,
  })

  const profile = profileData?.profile || null

  // Dev tools mutations
  const devToolsMutation = useMutation({
    mutationFn: ({ action, ...params }: { action: string; [key: string]: any }) =>
      fetchJson('/api/dev/tools', {
        method: 'POST',
        body: { action, ...params },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dev', 'user'] })
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles.byId(user.id) })
      }
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Operation failed')
    },
  })

  const quickLoginMutation = useMutation({
    mutationFn: ({ email, password, username, role }: { email: string; password: string; username: string; role?: string }) =>
      fetchJson('/api/dev/auth-bypass', {
        method: 'POST',
        body: {
          email,
          password,
          username,
          fullName: username.charAt(0).toUpperCase() + username.slice(1),
          role: role || 'member',
        },
      }),
    onSuccess: async (_, variables) => {
      // Wait a bit for profile to be synced after creation/update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: variables.email,
        password: variables.password,
      })

      if (signInError || !signInData.session) {
        toast.error(`User created but sign-in failed: ${signInError?.message || 'Unknown error'}`)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['dev', 'user'] })
      toast.success(`Logged in as ${variables.username}`)
      
      // If admin role, redirect to admin panel, otherwise stay on current page
      if (variables.role === 'admin') {
        router.push('/admin')
      }
      router.refresh()
    },
    onError: (error: any) => {
      const errorMsg = error.message || 'Failed to create/update user'
      toast.error(errorMsg, { duration: 10000 })
    },
  })

  const quickLogin = (email: string, password: string, username: string, role?: 'member' | 'editor' | 'admin') => {
    quickLoginMutation.mutate({ email, password, username, role })
  }

  const changeRole = (newRole: 'member' | 'editor' | 'admin') => {
    if (!user) {
      toast.error('No user logged in')
      return
    }
    devToolsMutation.mutate({ action: 'updateRole', role: newRole }, {
      onSuccess: () => {
        toast.success(`Role changed to ${newRole}. Refreshing...`)
        // Wait a moment for database to sync, then hard refresh
        setTimeout(() => {
          window.location.href = '/admin'
        }, 500)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to update role')
      },
    })
  }

  const clearSimulations = () => {
    if (!user) {
      toast.error('No user logged in')
      return
    }
    devToolsMutation.mutate({ action: 'clearSimulations' }, {
      onSuccess: () => {
        toast.success('All simulations cleared')
      },
    })
  }

  const togglePublicProfile = () => {
    if (!user || !profile) {
      toast.error('No user logged in')
      return
    }
    devToolsMutation.mutate({ action: 'toggleProfileVisibility' }, {
      onSuccess: (data: any) => {
        toast.success(`Profile is now ${data.isPublic ? 'public' : 'private'}`)
      },
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    queryClient.clear()
    toast.success('Logged out')
    router.push('/')
    router.refresh()
  }


  const seedComprehensive = () => {
    if (!user) {
      toast.error('No user logged in')
      return
    }
    devToolsMutation.mutate({ action: 'seedComprehensive' }, {
      onSuccess: (data: any) => {
        const results = data.results || {}
        const errors = results.errors || []
        
        if (errors.length > 0) {
          toast.warning(
            `Seed completed with ${errors.length} error(s). Created: ${results.simulations} simulations, ${results.debriefs} debriefs, ${results.articleProgress} article progress, ${results.notifications} notifications, ${results.threads} threads, ${results.posts} posts. Check console for details.`,
            { duration: 10000 }
          )
          console.warn('Seed errors:', errors)
        } else {
          toast.success(
            `Comprehensive seed completed! Created: ${results.simulations} simulations, ${results.debriefs} debriefs, ${results.articleProgress} article progress, ${results.notifications} notifications, ${results.threads} threads, ${results.posts} posts`,
            { duration: 8000 }
          )
        }
        router.refresh()
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to seed data', { duration: 10000 })
      },
    })
  }

  // Early return AFTER all hooks are declared
  if (!isDev) return null

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg"
          title="Dev Tools"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
      )}

      {/* Dev Tools Panel */}
      {isOpen && (
        <div 
          className="fixed bottom-4 right-4 z-50 transition-all"
          style={{
            width: isMinimized ? '350px' : '600px',
            maxHeight: isMinimized ? '60px' : '80vh',
          }}
        >
          <Card className="shadow-2xl border-purple-600 border-2">
            <CardHeader className="bg-purple-600 text-white p-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">🛠️ Dev Tools</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-white hover:bg-purple-700 h-8 w-8 p-0"
                  >
                    {isMinimized ? '□' : '−'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-purple-700 h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="p-4 overflow-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
                <Tabs defaultValue="auth" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                    <TabsTrigger value="user">User</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                  </TabsList>

                  {/* Auth Tab */}
                  <TabsContent value="auth" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">Quick Login</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => quickLogin('admin@praxis.test', 'admin123', 'admin', 'admin')}
                          variant="outline"
                          className="w-full"
                          disabled={quickLoginMutation.isPending}
                        >
                          👑 Admin
                        </Button>
                        <Button
                          onClick={() => quickLogin('editor@praxis.test', 'editor123', 'editor', 'editor')}
                          variant="outline"
                          className="w-full"
                          disabled={quickLoginMutation.isPending}
                        >
                          ✏️ Editor
                        </Button>
                        <Button
                          onClick={() => quickLogin('user@praxis.test', 'user123', 'testuser', 'member')}
                          variant="outline"
                          className="w-full"
                          disabled={quickLoginMutation.isPending}
                        >
                          👤 User
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Creates account if doesn't exist
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Current Session</h3>
                      {user ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <span className="text-sm">
                              <strong>{profile?.username || user.email}</strong>
                              <br />
                              <span className="text-xs text-gray-600">{user.email}</span>
                            </span>
                            <Badge variant="outline">{profile?.role || 'member'}</Badge>
                          </div>
                          <Button onClick={logout} variant="destructive" size="sm" className="w-full" disabled={quickLoginMutation.isPending}>
                            Logout
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                          Not logged in
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* User Tab */}
                  <TabsContent value="user" className="space-y-4">
                    {user ? (
                      <>
                        <div>
                          <h3 className="font-semibold mb-3">Change Role</h3>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              onClick={() => changeRole('member')}
                              variant={profile?.role === 'member' ? 'default' : 'outline'}
                              size="sm"
                              disabled={devToolsMutation.isPending}
                            >
                              Member
                            </Button>
                            <Button
                              onClick={() => changeRole('editor')}
                              variant={profile?.role === 'editor' ? 'default' : 'outline'}
                              size="sm"
                              disabled={devToolsMutation.isPending}
                            >
                              Editor
                            </Button>
                            <Button
                              onClick={() => changeRole('admin')}
                              variant={profile?.role === 'admin' ? 'default' : 'outline'}
                              size="sm"
                              disabled={devToolsMutation.isPending}
                            >
                              Admin
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Profile Settings</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Profile Visibility</span>
                              <Button
                                onClick={togglePublicProfile}
                                variant="outline"
                                size="sm"
                                disabled={devToolsMutation.isPending}
                              >
                                {profile?.isPublic ? '🌍 Public' : '🔒 Private'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Quick Links</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => router.push('/profile/edit')}
                              variant="outline"
                              size="sm"
                            >
                              Edit Profile
                            </Button>
                            <Button
                              onClick={() => router.push(`/profile/${profile?.username}`)}
                              variant="outline"
                              size="sm"
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Login to manage user settings</p>
                    )}
                  </TabsContent>

                  {/* Data Tab */}
                  <TabsContent value="data" className="space-y-4">
                    {user ? (
                      <>
                        <div>
                          <h3 className="font-semibold mb-3">✨ Comprehensive Seed</h3>
                          <Button
                            onClick={seedComprehensive}
                            variant="default"
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            disabled={devToolsMutation.isPending}
                          >
                            {devToolsMutation.isPending ? 'Seeding...' : '🌱 Seed Full Platform Data'}
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Creates simulations, debriefs, article progress, and notifications for a complete demo experience
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Simulation Data</h3>
                          <Button
                            onClick={clearSimulations}
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            disabled={devToolsMutation.isPending}
                          >
                            Clear All Simulations
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Removes all your simulation attempts and debriefs
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Quick Navigation</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              onClick={() => router.push('/admin/content')}
                              variant="outline"
                              size="sm"
                            >
                              Admin Panel
                            </Button>
                            <Button
                              onClick={() => router.push('/dashboard')}
                              variant="outline"
                              size="sm"
                            >
                              Dashboard
                            </Button>
                            <Button
                              onClick={() => router.push('/library')}
                              variant="outline"
                              size="sm"
                            >
                              Library
                            </Button>
                            <Button
                              onClick={() => router.push('/simulations')}
                              variant="outline"
                              size="sm"
                            >
                              Simulations
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Login to manipulate data</p>
                    )}
                  </TabsContent>

                  {/* Info Tab */}
                  <TabsContent value="info" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">Environment</h3>
                      <div className="space-y-1 text-xs font-mono bg-gray-50 p-3 rounded">
                        <div><strong>Mode:</strong> {process.env.NODE_ENV}</div>
                        <div><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...</div>
                        <div><strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3400'}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Database Info</h3>
                      <div className="space-y-1 text-xs bg-gray-50 p-3 rounded">
                        <div>📊 <strong>Supabase Studio:</strong> http://127.0.0.1:54333</div>
                        <div>🗄️ <strong>Database:</strong> postgresql://postgres:postgres@127.0.0.1:54332/postgres</div>
                        <div>🔌 <strong>API:</strong> http://127.0.0.1:54331</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Routes</h3>
                      <div className="text-xs space-y-1">
                        <div>✅ 20 total routes implemented</div>
                        <div>✅ Auth, Library, Simulations, Admin</div>
                        <div>✅ All features 100% complete</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Test Accounts</h3>
                      <div className="text-xs space-y-1 bg-blue-50 p-3 rounded">
                        <div><strong>Admin:</strong> admin@praxis.test / admin123</div>
                        <div><strong>Editor:</strong> editor@praxis.test / editor123</div>
                        <div><strong>User:</strong> user@praxis.test / user123</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

