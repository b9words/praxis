import { requireAuth } from '@/lib/auth/authorize'
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

    const user = await requireAuth()
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'updateRole':
        await prisma.profile.update({
          where: { id: user.id },
          data: { role: params.role },
        })
        return NextResponse.json({ success: true })

      case 'toggleProfileVisibility':
        const profile = await prisma.profile.findUnique({ where: { id: user.id } })
        await prisma.profile.update({
          where: { id: user.id },
          data: { isPublic: !profile?.isPublic },
        })
        return NextResponse.json({ success: true, isPublic: !profile?.isPublic })

      case 'clearSimulations':
        await prisma.simulation.deleteMany({
          where: { userId: user.id },
        })
        return NextResponse.json({ success: true })

      case 'createTestThread':
        const channel = await prisma.forumChannel.findFirst()
        if (!channel) {
          return NextResponse.json({ error: 'No channels found' }, { status: 404 })
        }
        const thread = await prisma.forumThread.create({
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

      case 'seedComprehensive':
        // Get email from current user
        const { getCurrentUser } = await import('@/lib/auth/get-user')
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
