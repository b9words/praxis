import EmailCampaignsManager from '@/components/admin/emails/EmailCampaignsManager'
import { requireRole } from '@/lib/auth/authorize'
import { redirect } from 'next/navigation'

export default async function AdminEmailsPage() {
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
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Email Campaigns & Newsletters</h1>
            <p className="text-sm text-gray-600">Manage automated email campaigns and newsletters</p>
          </div>
        </div>
      </div>

      <EmailCampaignsManager />
    </div>
  )
}


