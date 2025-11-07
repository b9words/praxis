import AdminContentClient from '@/components/admin/AdminContentClient'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AdminContentPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Content Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage articles, cases, and learning paths
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/content/new?type=article">
                <span className="text-xs">New Article</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/content/new?type=case">
                <span className="text-xs">New Case</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AdminContentClient />
      </div>
    </div>
  )
}
