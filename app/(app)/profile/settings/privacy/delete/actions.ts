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
    // Delete the Profile record first - this will CASCADE delete all associated data
    // (simulations, debriefs, progress, subscriptions, notifications, etc.)
    // per the ON DELETE CASCADE constraints in schema.prisma
    try {
      await prisma.profile.delete({
        where: { id: user.id },
      })
    } catch (error: any) {
      // If profile doesn't exist or deletion fails, log but continue to delete auth user
      console.error('Error deleting profile (may already be deleted):', error)
    }

    // Delete auth user via Supabase Admin API
    // This must happen after profile deletion since auth.user.id is the foreign key
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

    try {
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    } catch (error: any) {
      // If auth user deletion fails, log the error but don't throw
      // The profile and all associated data have already been deleted
      console.error('Error deleting auth user (may already be deleted):', error)
    }

    revalidatePath('/')
    // All redirects removed
  } catch (error) {
    console.error('Error deleting account:', error)
    throw new Error('Failed to delete account')
  }
}

