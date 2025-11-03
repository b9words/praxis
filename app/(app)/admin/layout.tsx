import AdminSidebar from '@/components/admin/AdminSidebar'
import { requireRole } from '@/lib/auth/authorize'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect all admin routes at the layout level
  try {
    await requireRole(['editor', 'admin'])
  } catch {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </div>
  )
}

