import LearningPathsManager from '@/components/admin/LearningPathsManager'
import { requireRole } from '@/lib/auth/authorize'
import { redirect } from 'next/navigation'

export default async function AdminLearningPathsPage() {
  try {
    await requireRole(['editor', 'admin'])
  } catch {
    redirect('/admin')
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Learning Paths Management</h1>
            <p className="text-sm text-gray-600">Create and manage curated learning paths</p>
          </div>
        </div>
      </div>

      <LearningPathsManager />
    </div>
  )
}

