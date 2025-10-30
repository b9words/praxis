import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Dev-only API route to bypass email confirmation and rate limits
 * Uses Supabase admin API to create/authenticate users directly
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { email, password, username, fullName, role } = body

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, username' },
        { status: 400 }
      )
    }

    // Validate that we have the service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey) {
      return NextResponse.json(
        { 
          error: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. Please check your .env.local file.',
          hint: 'For local Supabase, run "supabase start" and copy the service_role key to .env.local'
        },
        { status: 500 }
      )
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL is not set in environment variables' },
        { status: 500 }
      )
    }

    // Create admin client with service role key
    let supabaseAdmin: ReturnType<typeof createClient>
    try {
      supabaseAdmin = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    } catch (clientError: any) {
      return NextResponse.json(
        { 
          error: 'Failed to create Supabase admin client',
          details: clientError.message,
          hint: 'Check that SUPABASE_SERVICE_ROLE_KEY matches your Supabase instance (local vs remote)'
        },
        { status: 500 }
      )
    }

    // Test the admin client by trying to list users
    let existingUser
    try {
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        // Check if it's a JWT signature error (key mismatch)
        const isJwtError = listError.message?.toLowerCase().includes('jwt') || 
                          listError.message?.toLowerCase().includes('signature') ||
                          listError.message?.toLowerCase().includes('invalid token')
        
        const isLocal = supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost')
        
        let hint = 'The service role key may be invalid or from a different Supabase instance.'
        if (isJwtError && isLocal) {
          hint = `Your SUPABASE_SERVICE_ROLE_KEY doesn't match your local Supabase instance. To fix:
1. Run: supabase status
2. Copy the "service_role" key from the output
3. Update SUPABASE_SERVICE_ROLE_KEY in .env.local with the local key
4. Restart your Next.js dev server`
        }
        
        return NextResponse.json(
          { 
            error: `Failed to access Supabase admin API: ${listError.message}`,
            hint,
            isJwtError,
            supabaseUrl: isLocal ? 'local' : 'remote'
          },
          { status: 500 }
        )
      }

      existingUser = existingUsers.users.find((u) => u.email === email)
    } catch (adminError: any) {
      return NextResponse.json(
        { 
          error: `Admin API error: ${adminError.message}`,
          hint: 'Verify your SUPABASE_SERVICE_ROLE_KEY is correct for your Supabase instance'
        },
        { status: 500 }
      )
    }

    let userId: string

    if (existingUser) {
      // Update existing user: confirm email and update password/metadata
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            username,
            full_name: fullName || username.charAt(0).toUpperCase() + username.slice(1),
          },
        }
      )

      if (updateError || !updatedUser.user) {
        return NextResponse.json(
          { error: `Failed to update user: ${updateError?.message}` },
          { status: 500 }
        )
      }

      userId = updatedUser.user.id
    } else {
      // Create new user with email already confirmed
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Bypass email confirmation
        user_metadata: {
          username,
          full_name: fullName || username.charAt(0).toUpperCase() + username.slice(1),
        },
      })

      if (createError || !newUser.user) {
        return NextResponse.json(
          { error: `Failed to create user: ${createError?.message}` },
          { status: 500 }
        )
      }

      userId = newUser.user.id
    }

    // Ensure profile exists with correct role
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      // Create profile
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: userId,
        username,
        full_name: fullName || username.charAt(0).toUpperCase() + username.slice(1),
        role: role || 'member',
      } as any)

      if (profileError) {
        return NextResponse.json(
          { error: `Failed to create profile: ${profileError.message}` },
          { status: 500 }
        )
      }
    } else if (role && (existingProfile as any).role !== role) {
      // Update role if specified and different
      const updateData: { role: string } = { role }
      const { error: profileError } = await (supabaseAdmin
        .from('profiles') as any)
        .update(updateData)
        .eq('id', userId)

      if (profileError) {
        return NextResponse.json(
          { error: `Failed to update profile: ${profileError.message}` },
          { status: 500 }
        )
      }
    }

    // Ensure user has a residency so they can access the dashboard
    // Use Prisma to create residency in the same database Prisma queries from
    const { prisma } = await import('@/lib/prisma/server')
    
    try {
      const existingResidency = await prisma.userResidency.findUnique({
        where: { userId },
      })

      if (!existingResidency) {
        // Create residency for dev user (default to year 1)
        await prisma.userResidency.create({
          data: {
            userId,
            currentResidency: 1,
          },
        })
      }
    } catch (residencyError: any) {
      // Log but don't fail - user can still login and set it up later
      console.warn('Failed to create residency for dev user:', residencyError?.message)
    }

    // Since we've already confirmed the email via admin API, we don't need magic links
    // The client can directly use password login which will work immediately
    // This is simpler and more reliable than magic links for dev purposes
    return NextResponse.json({
      success: true,
      userId,
      email,
      username,
      message: 'User created/updated successfully. Password login will work immediately.',
      usePasswordLogin: true,
    })
  } catch (error: any) {
    console.error('Dev auth bypass error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}
