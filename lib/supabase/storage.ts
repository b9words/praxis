import { createClient } from './client';
import { createClient as createServerClient } from './server';

/**
 * Storage Helper Library for Supabase Storage operations
 * Handles file uploads, fetches, and metadata synchronization
 */

const STORAGE_BUCKET = 'assets'

/**
 * Upload a file to Supabase Storage
 * @param path - The storage path (e.g., 'articles/year1/domain/lesson.md')
 * @param file - The File object to upload
 * @returns The storage path if successful
 */
export async function uploadToStorage(
  path: string,
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        upsert: true, // Overwrite if exists
        contentType: file.type || 'text/plain'
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, path: data.path }
  } catch (error) {
    console.error('Upload exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Fetch file content from Supabase Storage
 * @param path - The storage path
 * @returns The file content as text
 */
export async function fetchFromStorage(
  path: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path)

    if (error) {
      console.error('Storage download error:', error)
      return { success: false, error: error.message }
    }

    const content = await data.text()
    return { success: true, content }
  } catch (error) {
    console.error('Download exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Fetch file content from Supabase Storage (server-side)
 * @param path - The storage path
 * @returns The file content as text
 */
export async function fetchFromStorageServer(
  path: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path)

    if (error) {
      console.error('Storage download error:', error)
      return { success: false, error: error.message }
    }

    const content = await data.text()
    return { success: true, content }
  } catch (error) {
    console.error('Download exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Sync file metadata to database via API route
 * @param bucket - The storage bucket name
 * @param path - The storage path
 * @returns Success status and any error message
 */
export async function syncFileMetadata(
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      console.error('Sync API error:', errorData)
      return { success: false, error: errorData.error || response.statusText }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Sync exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * List files in a Supabase Storage directory
 * @param prefix - The directory prefix (e.g., 'articles/year1/')
 * @returns Array of file objects
 */
export async function listStorageFiles(
  prefix: string = ''
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(prefix)

    if (error) {
      console.error('Storage list error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, files: data }
  } catch (error) {
    console.error('List exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get a public URL for a file in storage
 * @param path - The storage path
 * @returns The public URL
 */
export function getStoragePublicUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  
  return data.publicUrl
}

