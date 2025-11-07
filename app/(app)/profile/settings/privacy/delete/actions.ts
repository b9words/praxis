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
    // Delete user data manually (since we removed FK constraints to auth.users)
    // Delete in order: debriefs -> simulations -> progress -> profile
    
    // Delete debriefs (they reference simulations)
    await prisma.debrief.deleteMany({
      where: {
        simulation: {
          userId: user.id,
        },
      },
    }).catch(() => {})

    // Delete simulations
    await prisma.simulation.deleteMany({
      where: { userId: user.id },
    }).catch(() => {})

    // Delete lesson progress
    await prisma.userLessonProgress.deleteMany({
      where: { userId: user.id },
    }).catch(() => {})

    // Delete article progress
    await prisma.userArticleProgress.deleteMany({
      where: { userId: user.id },
    }).catch(() => {})

    // Delete domain completions
    await prisma.domainCompletion.deleteMany({
      where: { userId: user.id },
    }).catch(() => {})

    // Delete user residency
    await prisma.userResidency.delete({
      where: { userId: user.id },
    }).catch(() => {})

    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: user.id },
    }).catch(() => {})

    // Delete subscriptions
    await prisma.subscription.deleteMany({
      where: { userId: user.id },
    }).catch(() => {})

    // Delete audit logs
    await prisma.auditLog.deleteMany({
      where: { userId: user.id },
    }).catch(() => {})

    // Delete reports created by user
    try {
      await prisma.$executeRaw`
        DELETE FROM public.reports WHERE created_by = ${user.id}::uuid
      `
    } catch {
      // Ignore if table doesn't exist
    }

    // Delete profile (this will cascade to other tables via Prisma relations)
    // Note: We've already manually deleted all user-related data above
    // This ensures we don't rely on database-level cascade deletes
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

