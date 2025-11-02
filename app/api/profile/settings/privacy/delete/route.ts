import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user data in correct order (respecting foreign key constraints)
    // Prisma will handle cascade deletes where defined, but we'll be explicit
    
    try {
      // Delete in order: debriefs -> simulations -> lesson progress -> residency -> profile
      // These should cascade, but we'll be explicit

      // Delete debriefs (they reference simulations)
      await prisma.debrief.deleteMany({
        where: {
          simulation: {
            userId: user.id,
          },
        },
      })

      // Delete simulations
      await prisma.simulation.deleteMany({
        where: { userId: user.id },
      })

      // Delete lesson progress
      await prisma.userLessonProgress.deleteMany({
        where: { userId: user.id },
      })

      // Delete user residency if it exists
      try {
        await prisma.userResidency.delete({
          where: { userId: user.id },
        }).catch(() => {
          // Ignore if doesn't exist
        })
      } catch (error) {
        // Ignore if table doesn't exist
      }

      // Delete profile (should cascade or handle other relations)
      await prisma.profile.delete({
        where: { id: user.id },
      }).catch((error) => {
        // If profile delete fails, continue with auth user deletion
        console.error('Error deleting profile:', error)
      })
    } catch (error) {
      console.error('Error during data deletion:', error)
      // Continue to auth user deletion
    }

    // Delete the auth user (Supabase)
    // Note: This requires Supabase Admin API
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.error('Error deleting auth user:', deleteError)
        // Return partial success - data deleted but auth user remains
        return NextResponse.json({ 
          message: 'Account data deleted. Auth user deletion may require manual intervention.',
          warning: true 
        })
      }
    } catch (error) {
      console.error('Error in auth user deletion:', error)
      return NextResponse.json({ 
        message: 'Account data deleted. Auth user deletion failed - please contact support.',
        warning: true 
      })
    }

    return NextResponse.json({ 
      message: 'Account successfully deleted',
      success: true 
    })
  } catch (error) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

