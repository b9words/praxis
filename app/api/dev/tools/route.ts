import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/dev/tools
 * Dev-only tools endpoint
 * Body: { action: string, ...params }
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'updateRole':
        // Get full user for profile creation if needed
        const fullUser = await getCurrentUser()
        
        // Check if profile exists
        const existingProfile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { id: true, role: true },
        })
        
        let updatedProfile
        if (!existingProfile) {
          // Profile doesn't exist - create it using Supabase (handles schema correctly)
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )
          
          const username = (fullUser as any)?.user_metadata?.username || fullUser?.email?.split('@')[0] || `user-${user.id.substring(0, 8)}`
          const uniqueUsername = `${username}_${user.id.substring(0, 8)}`
          
          const { error: createError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: user.id,
              username: uniqueUsername,
              full_name: (fullUser as any)?.user_metadata?.full_name || username,
              role: params.role,
              is_public: false,
            }, { onConflict: 'id' })
          
          if (createError) {
            console.error(`[dev-tools] Failed to create profile: ${createError.message}`)
            return NextResponse.json({ error: `Failed to create profile: ${createError.message}` }, { status: 500 })
          }
          
          // Wait a bit for the profile to be available
          await new Promise(resolve => setTimeout(resolve, 300))
          
          updatedProfile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: { id: true, role: true },
          })
          
          if (!updatedProfile) {
            return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 })
          }
          
          console.log(`[dev-tools] Created profile for user ${user.id} with role: ${updatedProfile.role}`)
        } else {
          // Profile exists - update the role
          try {
            updatedProfile = await prisma.profile.update({
              where: { id: user.id },
              data: { role: params.role as any },
              select: { id: true, role: true },
            })
            console.log(`[dev-tools] Updated role for user ${user.id} from ${existingProfile.role} to: ${updatedProfile.role}`)
          } catch (error: any) {
            // Handle missing columns (P2022) or other schema issues
            if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
              try {
                updatedProfile = await prisma.profile.update({
                  where: { id: user.id },
                  data: { role: params.role as any },
                  select: { id: true, role: true },
                })
                console.log(`[dev-tools] Updated role for user ${user.id} from ${existingProfile.role} to: ${updatedProfile.role}`)
              } catch (fallbackError) {
                console.error('Error updating role (fallback):', fallbackError)
                return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
              }
            } else {
              throw error
            }
          }
        }
        
        // Verify the update persisted
        const verifiedProfile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        
        if (verifiedProfile?.role !== params.role) {
          console.error(`[dev-tools] Role update verification failed: expected ${params.role}, got ${verifiedProfile?.role}`)
          return NextResponse.json({ 
            error: `Role update verification failed. Expected ${params.role} but got ${verifiedProfile?.role}` 
          }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, role: updatedProfile.role })

      case 'toggleProfileVisibility':
        let profile = null
        try {
          profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: { id: true, isPublic: true },
          })
        } catch (error: any) {
          // Handle missing columns (P2022) or other schema issues
          if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
            try {
              profile = await prisma.profile.findUnique({
                where: { id: user.id },
                select: { id: true, isPublic: true },
              })
            } catch (fallbackError) {
              console.error('Error fetching profile (fallback):', fallbackError)
              return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
            }
          } else {
            throw error
          }
        }
        try {
          await prisma.profile.update({
            where: { id: user.id },
            data: { isPublic: !profile?.isPublic },
            select: { id: true },
          })
        } catch (error: any) {
          // Handle missing columns (P2022) or other schema issues
          if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
            try {
              await prisma.profile.update({
                where: { id: user.id },
                data: { isPublic: !profile?.isPublic },
                select: { id: true },
              })
            } catch (fallbackError) {
              console.error('Error updating profile visibility (fallback):', fallbackError)
              return NextResponse.json({ error: 'Failed to update profile visibility' }, { status: 500 })
            }
          } else {
            throw error
          }
        }
        return NextResponse.json({ success: true, isPublic: !profile?.isPublic })

      case 'clearSimulations':
        await prisma.simulation.deleteMany({
          where: { userId: user.id },
        })
        return NextResponse.json({ success: true })

      case 'createTestThread':
        let channel: any = null
        try {
          channel = await (prisma as any).forumChannel.findFirst()
        } catch (error: any) {
          return NextResponse.json({ error: 'Forum channels are not available' }, { status: 503 })
        }
        if (!channel) {
          return NextResponse.json({ error: 'No channels found' }, { status: 404 })
        }
        let thread: any = null
        try {
          thread = await (prisma as any).forumThread.create({
            data: {
              channelId: channel.id,
              authorId: user.id,
              title: `Test Thread - ${new Date().toLocaleTimeString()}`,
              content: 'This is a test thread created by DevTools',
            },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                },
              },
              channel: {
                select: {
                  slug: true,
                },
              },
            },
          })
          return NextResponse.json({ success: true, thread })
        } catch (error: any) {
          return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
        }

      case 'seedComprehensive':
        // Get email from current user
        const currentUser = await getCurrentUser()
        
        // Use the shared seed function
        const { seedComprehensiveData } = await import('@/lib/dev-seed')
        const results = await seedComprehensiveData(user.id, currentUser?.email)
        
        const hasErrors = results.errors && results.errors.length > 0
        return NextResponse.json({
          success: !hasErrors,
          message: hasErrors 
            ? 'Seed completed with some errors' 
            : 'Comprehensive seed data created successfully',
          results,
        }, { status: hasErrors ? 207 : 200 })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error in dev tools:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}
