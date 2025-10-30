'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isDev, setIsDev] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Only show in development
    setIsDev(process.env.NODE_ENV === 'development')
    
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (!isDev) return null

  const quickLogin = async (email: string, password: string, username: string, role?: 'member' | 'editor' | 'admin') => {
    try {
      // First, try to use the dev auth bypass API (bypasses rate limits and email confirmation)
      const response = await fetch('/api/dev/auth-bypass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullName: username.charAt(0).toUpperCase() + username.slice(1),
          role: role || 'member',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Display error with hint if available
        const errorMsg = result.error || 'Failed to create/update user'
        const hintMsg = result.hint ? `\n\n${result.hint}` : ''
        toast.error(errorMsg + hintMsg, {
          duration: 10000, // Show for 10 seconds to give time to read
        })
        return
      }

      // Since the user is created/updated with email confirmed via admin API,
      // we can sign in with password immediately (no magic link needed)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError || !signInData.session) {
        toast.error(`User created but sign-in failed: ${signInError?.message || 'Unknown error'}`)
        return
      }

      toast.success(`Logged in as ${username}`)
      // Explicitly navigate to dashboard after successful login
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error('Login failed: ' + (error.message || 'Unknown error'))
    }
  }

  const changeRole = async (newRole: 'member' | 'editor' | 'admin') => {
    if (!user) {
      toast.error('No user logged in')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to change role')
      return
    }

    toast.success(`Role changed to ${newRole}`)
    router.refresh()
  }

  const clearSimulations = async () => {
    if (!user) {
      toast.error('No user logged in')
      return
    }

    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to clear simulations')
      return
    }

    toast.success('All simulations cleared')
    router.refresh()
  }

  const togglePublicProfile = async () => {
    if (!user || !profile) {
      toast.error('No user logged in')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_public: !profile.is_public })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to toggle profile visibility')
      return
    }

    toast.success(`Profile is now ${!profile.is_public ? 'public' : 'private'}`)
    setProfile({ ...profile, is_public: !profile.is_public })
    router.refresh()
  }

  const logout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/')
    router.refresh()
  }

  const seedTestThread = async () => {
    if (!user) {
      toast.error('No user logged in')
      return
    }

    const { data: channel } = await supabase
      .from('forum_channels')
      .select('*')
      .limit(1)
      .single()

    if (!channel) {
      toast.error('No channels found')
      return
    }

    const { error } = await supabase
      .from('forum_threads')
      .insert({
        channel_id: channel.id,
        author_id: user.id,
        title: 'Test Thread - ' + new Date().toLocaleTimeString(),
        content: 'This is a test thread created by DevTools',
      })

    if (error) {
      toast.error('Failed to create test thread')
      return
    }

    toast.success('Test thread created')
    router.refresh()
  }

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
                        >
                          👑 Admin
                        </Button>
                        <Button
                          onClick={() => quickLogin('editor@praxis.test', 'editor123', 'editor', 'editor')}
                          variant="outline"
                          className="w-full"
                        >
                          ✏️ Editor
                        </Button>
                        <Button
                          onClick={() => quickLogin('user@praxis.test', 'user123', 'testuser', 'member')}
                          variant="outline"
                          className="w-full"
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
                              <strong>{profile?.username || 'Loading...'}</strong>
                              <br />
                              <span className="text-xs text-gray-600">{user.email}</span>
                            </span>
                            <Badge variant="outline">{profile?.role || 'member'}</Badge>
                          </div>
                          <Button onClick={logout} variant="destructive" size="sm" className="w-full">
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
                            >
                              Member
                            </Button>
                            <Button
                              onClick={() => changeRole('editor')}
                              variant={profile?.role === 'editor' ? 'default' : 'outline'}
                              size="sm"
                            >
                              Editor
                            </Button>
                            <Button
                              onClick={() => changeRole('admin')}
                              variant={profile?.role === 'admin' ? 'default' : 'outline'}
                              size="sm"
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
                              >
                                {profile?.is_public ? '🌍 Public' : '🔒 Private'}
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
                          <h3 className="font-semibold mb-3">Simulation Data</h3>
                          <Button
                            onClick={clearSimulations}
                            variant="destructive"
                            size="sm"
                            className="w-full"
                          >
                            Clear All Simulations
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Removes all your simulation attempts and debriefs
                          </p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Community</h3>
                          <Button
                            onClick={seedTestThread}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Create Test Thread
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Adds a test thread in the first channel
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
                              onClick={() => router.push('/community')}
                              variant="outline"
                              size="sm"
                            >
                              Community
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
                        <div>✅ Auth, Library, Simulations, Community, Admin</div>
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

