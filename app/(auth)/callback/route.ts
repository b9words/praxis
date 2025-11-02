import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma/server'

export async function GET(request: Request) {
  // All redirects removed - handle auth callback without redirects
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // If session created and user is new, send welcome email
    if (data.session && data.user && !error) {
      try {
        // Check if welcome email was already sent by looking at user metadata
        const userMetadata = data.user.user_metadata || {}
        const welcomeEmailSent = userMetadata.welcome_email_sent === true
        
        if (!welcomeEmailSent) {
          // Get user profile to get full name
          const profile = await prisma.profile.findUnique({
            where: { id: data.user.id },
            select: { fullName: true, username: true },
          })
          
          const userName = profile?.fullName || userMetadata.full_name || userMetadata.username || undefined
          const userEmail = data.user.email
          
          if (userEmail) {
            // Send welcome email
            await sendWelcomeEmail(userEmail, userName)
            
            // Mark welcome email as sent in user metadata
            await supabase.auth.updateUser({
              data: { welcome_email_sent: true },
            })
          }
        }
      } catch (emailError) {
        // Don't fail auth if email fails
        console.error('Failed to send welcome email on first login:', emailError)
      }
    }
  }

  return NextResponse.json({ success: true })
}


