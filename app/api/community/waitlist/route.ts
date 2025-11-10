import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { sendGeneralNotificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !user.id || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await prisma.communityWaitlist.findUnique({ where: { userId: user.id } })
    if (existing) {
      return NextResponse.json({ message: 'Already on waitlist' }, { status: 200 })
    }

    await prisma.communityWaitlist.create({ data: { userId: user.id, email: user.email } })

    // Fire-and-forget is acceptable; awaiting but ignoring failure keeps UX simple
    await sendGeneralNotificationEmail(user.email, {
      title: "You're on the Founding 100 Waitlist",
      message: "We'll notify you as doors open and share early updates.",
      actionUrl: (process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com') + '/dashboard',
      actionText: 'Go to Dashboard',
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    // Handle potential unique-violation race
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Already on waitlist' }, { status: 200 })
    }
    console.error('Waitlist signup error:', error)
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
}


