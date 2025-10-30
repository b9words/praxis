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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <StorageContentEditor contentType={contentType} storagePath={storagePath} />
    </div>
  )
}
