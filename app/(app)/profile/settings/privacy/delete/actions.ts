'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No user found')
  }

  try {
    // Soft delete: blank out PII in profile
    // Note: emailNotificationsEnabled may not exist in all database instances
    try {
      await prisma.profile.update({
        where: { id: user.id },
        data: {
          fullName: null,
          bio: null,
          avatarUrl: null,
          isPublic: false,
          // emailNotificationsEnabled: false, // Commented out - may not exist in all DB instances
        },
      })
    } catch (error: any) {
      // Handle missing columns (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        // Fallback: try update with explicit select to avoid accessing missing columns
        await prisma.profile.update({
          where: { id: user.id },
          data: {
            fullName: null,
            bio: null,
            avatarUrl: null,
            isPublic: false,
          },
          select: {
            id: true,
          },
        })
      } else {
        throw error
      }
    }

    // Delete auth user via Supabase Admin API
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    await supabaseAdmin.auth.admin.deleteUser(user.id)

    revalidatePath('/')
    // All redirects removed
  } catch (error) {
    console.error('Error deleting account:', error)
    throw new Error('Failed to delete account')
  }
}

