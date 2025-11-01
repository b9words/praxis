import StorageContentEditor from '@/components/admin/StorageContentEditor';
import { requireRole } from '@/lib/auth/authorize';
import { notFound, redirect } from 'next/navigation';

export default async function AdminEditPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string; type?: string }>
}) {
  try {
    await requireRole(['admin', 'editor'])
  } catch {
    redirect('/dashboard')
  }

  const params = await searchParams
  const storagePath = params.path
  const contentType = params.type as 'article' | 'case' | undefined

  if (!storagePath || !contentType) {
    notFound()
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <StorageContentEditor contentType={contentType} storagePath={storagePath} />
    </div>
  )
}
