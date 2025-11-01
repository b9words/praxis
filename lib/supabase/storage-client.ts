/**
 * Client-only storage helpers that don't import server code
 * Use API routes for actual operations
 */

/**
 * Upload file via API route (client-side only)
 */
export async function uploadFileToStorage(
  path: string,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', path)

  try {
    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Upload failed' }
    }

    return { success: true, path: data.path }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sync metadata via API route (client-side only)
 */
export async function syncMetadata(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const response = await fetch('/api/storage/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bucket, path }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Sync failed' }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch file content via API route (client-side only)
 */
export async function fetchFileFromStorage(
  path: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(`/api/storage?path=${encodeURIComponent(path)}`)

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Fetch failed' }
    }

    return { success: true, content: data.content }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
