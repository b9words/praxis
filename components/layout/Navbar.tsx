'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import type { User } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, BookOpen, Compass, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import NotificationsBell from '@/components/nav/NotificationsBell'

type Profile = Database['public']['Tables']['profiles']['Row']

interface NavbarProps {
  user: User
  profile: Profile | null
}

interface UserProgress {
  currentResidency?: number
  articlesCompleted: number
  totalArticles: number
  simulationsCompleted: number
  progressPercentage: number
}

export default function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Fetch user progress with React Query
  const { data: userProgress } = useQuery({
    queryKey: queryKeys.user.progress(),
    queryFn: ({ signal }) => fetchJson<UserProgress | null>('/api/user/progress', { signal }),
    retry: false,
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    // All redirects removed
  }

  const navLinks = [
    { 
      href: '/dashboard', 
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Your analytical workspace'
    },
    { 
      href: '/discover', 
      label: 'Discover',
      icon: Compass,
      description: 'Curated paths and themes'
    },
    { 
      href: '/library/curriculum', 
      label: 'Library',
      icon: BookOpen,
      description: userProgress ? `${userProgress.articlesCompleted}/${userProgress.totalArticles} articles` : 'Intelligence library'
    },
    {
      href: '/community',
      label: 'Network',
      icon: Users,
      description: 'Connect with peers'
    },
  ]

  if (profile?.role === 'admin' || profile?.role === 'editor') {
    navLinks.push({ 
      href: '/admin', 
      label: 'Admin',
      icon: BarChart3,
      description: 'Content management'
    })
  }

  return (
    <>
      {/* Desktop/Tablet Navbar - Top */}
      <nav className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-xl font-semibold text-gray-900">Execemy</span>
                {userProgress?.currentResidency && (
                  <Badge variant="outline" className="ml-3 text-xs font-medium text-gray-700 border-gray-300">
                    Year {userProgress.currentResidency}
                  </Badge>
                )}
              </Link>
              <div className="lg:ml-8 lg:flex lg:space-x-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-gray-900 text-gray-900 bg-gray-50'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || ''} />
                      <AvatarFallback>
                        {profile?.username?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || profile?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {userProgress && (
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Year {userProgress.currentResidency} Progress</span>
                            <span>{userProgress.progressPercentage}%</span>
                          </div>
                          <Progress value={userProgress.progressPercentage} className="h-2" />
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={profile?.username ? `/profile/${profile.username}` : '/profile'}>
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/edit">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {userProgress && (
                    <DropdownMenuItem asChild>
                      <Link href="/residency">
                        Change Residency
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Navigator */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-600'
                }`}
              >
                <link.icon className={`h-5 w-5 mb-1 ${isActive ? 'text-gray-900' : 'text-gray-600'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                  {link.label}
                </span>
              </Link>
            )
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 h-full">
                <Avatar className="h-5 w-5 mb-1">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || ''} />
                  <AvatarFallback className="text-[8px]">
                    {profile?.username?.slice(0, 1).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-medium text-gray-600">Profile</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 mb-16" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || profile?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  {userProgress && (
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Year {userProgress.currentResidency} Progress</span>
                        <span>{userProgress.progressPercentage}%</span>
                      </div>
                      <Progress value={userProgress.progressPercentage} className="h-2" />
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={profile?.username ? `/profile/${profile.username}` : '/profile'}>
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/edit">
                  Settings
                </Link>
              </DropdownMenuItem>
              {userProgress && (
                <DropdownMenuItem asChild>
                  <Link href="/residency">
                    Change Residency
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  )
}


