'use server'

import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
  const user = await requireAuth()

  try {
    // Soft delete: blank out PII in profile
    // Note: emailNotificationsEnabled may not exist in all database instances
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
    redirect('/')
  } catch (error) {
    console.error('Error deleting account:', error)
    throw new Error('Failed to delete account')
  }
}

