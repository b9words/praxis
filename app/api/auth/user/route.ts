import { getCurrentUser } from '@/lib/auth/get-user'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ email: null, id: null }, { status: 200 })
    }
    
    return NextResponse.json({
      email: user.email || null,
      id: user.id || null,
    })
  } catch (error) {
    // Fail gracefully - return null values
    return NextResponse.json({ email: null, id: null }, { status: 200 })
  }
}

