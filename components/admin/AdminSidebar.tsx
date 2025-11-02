'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  Activity,
  Settings,
  BarChart3,
  Route,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Content',
    href: '/admin/content',
    icon: FileText,
    children: [
      { name: 'Manage Content', href: '/admin/content' },
      { name: 'Generate Curriculum', href: '/admin/content/generate' },
      { name: 'Upload Files', href: '/admin/upload' },
    ],
  },
  {
    name: 'Learning Paths',
    href: '/admin/learning-paths',
    icon: Route,
  },
  {
    name: 'Competencies',
    href: '/admin/competencies',
    icon: GraduationCap,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Simulations',
    href: '/admin/simulations',
    icon: Activity,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'System',
    href: '/admin/system',
    icon: Settings,
    children: [
      { name: 'Notifications', href: '/admin/system/notifications' },
      { name: 'Send Emails', href: '/admin/system/notifications/manage' },
      { name: 'Token Usage', href: '/admin/system/token-usage' },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r border-gray-200 bg-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Admin Panel</h2>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
                {item.children && isActive && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'block px-3 py-2 rounded-md text-sm transition-colors',
                            isChildActive
                              ? 'bg-gray-100 text-gray-900 font-medium'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          )}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

