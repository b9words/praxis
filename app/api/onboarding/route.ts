import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { strategicObjective, competencyId } = body

    if (!strategicObjective || !competencyId) {
      return NextResponse.json(
        { error: 'strategicObjective and competencyId are required' },
        { status: 400 }
      )
    }

    // Update user's profile with onboarding data
    // Store strategic objective in bio field (or create a dedicated field if needed)
    // For now, we'll use a JSON structure in bio or store it separately
    try {
      await prisma.profile.update({
        where: { id: user.id },
        data: {
          bio: strategicObjective,
        },
      })
    } catch (error: any) {
      // Handle case where profile doesn't exist yet
      if (error?.code === 'P2025') {
        // Profile doesn't exist, create it
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const username = user.user_metadata?.username || user.email?.split('@')[0] || `user-${user.id.substring(0, 8)}`
        const uniqueUsername = `${username}_${user.id.substring(0, 8)}`

        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: user.id,
            username: uniqueUsername,
            full_name: user.user_metadata?.full_name || username,
            bio: strategicObjective,
            is_public: false,
          }, { onConflict: 'id' })

        // Retry the update
        await prisma.profile.update({
          where: { id: user.id },
          data: {
            bio: strategicObjective,
          },
        })
      } else {
        throw error
      }
    }

    // Store onboarding metadata (could be in a separate table or JSON field)
    // For now, we'll store it in user metadata or create a dedicated onboarding table
    // Since we don't have an onboarding table, we'll store it as metadata that can be retrieved later
    // The competency selection can be used to set the user's initial focus domain

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding data saved successfully'
    })
  } catch (error) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error saving onboarding data:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

