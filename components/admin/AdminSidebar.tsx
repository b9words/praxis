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
  Mail,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: { name: string; href: string }[]
  group?: string
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    group: 'Overview',
  },
  {
    name: 'Content',
    href: '/admin/content',
    icon: FileText,
    group: 'Content',
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
    group: 'Content',
  },
  {
    name: 'Competencies',
    href: '/admin/competencies',
    icon: GraduationCap,
    group: 'Content',
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    group: 'Management',
  },
  {
    name: 'Simulations',
    href: '/admin/simulations',
    icon: Activity,
    group: 'Management',
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    group: 'Management',
  },
  {
    name: 'System',
    href: '/admin/system',
    icon: Settings,
    group: 'System',
    children: [
      { name: 'Notifications', href: '/admin/system/notifications' },
      { name: 'Send Emails', href: '/admin/system/notifications/manage' },
      { name: 'Automated Emails', href: '/admin/system/emails' },
      { name: 'Token Usage', href: '/admin/system/token-usage' },
      { name: 'Briefing Schedule', href: '/admin/briefing' },
    ],
  },
  {
    name: 'Email Campaigns',
    href: '/admin/emails',
    icon: Mail,
    group: 'System',
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(
      navigation
        .filter((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return isActive && item.children
        })
        .map((item) => item.href)
    )
  )

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(href)) {
      newExpanded.delete(href)
    } else {
      newExpanded.add(href)
    }
    setExpandedItems(newExpanded)
  }

  // Group navigation items
  const groupedNav = navigation.reduce((acc, item) => {
    const group = item.group || 'Other'
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  return (
    <div className="w-64 border-r border-neutral-200 bg-white h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-neutral-900 opacity-30" />
            <div>
              <h1 className="text-base font-light text-neutral-900 tracking-tight">Admin</h1>
              <p className="text-xs text-neutral-500 mt-0.5">Management Panel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-8">
        {Object.entries(groupedNav).map(([groupName, items]) => (
          <div key={groupName}>
            <div className="px-2 mb-3">
              <h2 className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                {groupName}
              </h2>
            </div>
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                const isExpanded = expandedItems.has(item.href)
                const hasChildren = item.children && item.children.length > 0
                const Icon = item.icon

                return (
                  <div key={item.name}>
                    <div className="relative flex items-center group">
                      <Link
                        href={item.href}
                        className={cn(
                          'flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all',
                          'hover:bg-neutral-50',
                          isActive
                            ? 'text-neutral-900 bg-neutral-50'
                            : 'text-neutral-600 hover:text-neutral-900'
                        )}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neutral-900 opacity-40" />
                        )}
                        
                        <Icon className={cn(
                          'h-4 w-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-neutral-900' : 'text-neutral-500 group-hover:text-neutral-700'
                        )} />
                        
                        <span className="flex-1">{item.name}</span>
                      </Link>
                      
                      {hasChildren && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            toggleExpanded(item.href)
                          }}
                          className={cn(
                            'p-1.5 -mr-1.5 flex-shrink-0 transition-colors rounded-sm',
                            'hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600'
                          )}
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          <ChevronRight
                            className={cn(
                              'h-3.5 w-3.5 transition-transform',
                              isExpanded && 'transform rotate-90'
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Children */}
                    {hasChildren && isExpanded && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-neutral-200 pl-2">
                        {item.children!.map((child) => {
                          const isChildActive = pathname === child.href
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                'block px-3 py-2 text-xs font-medium transition-colors rounded-sm',
                                isChildActive
                                  ? 'text-neutral-900 bg-neutral-100'
                                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
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
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}

