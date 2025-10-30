import { createClient } from '@supabase/supabase-js'

/**
 * Admin auth helper for E2E tests
 * Uses Supabase admin API to create test users without rate limiting
 */

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

export interface TestUserCreation {
  email: string
  password: string
  username: string
  fullName?: string
  role?: 'member' | 'editor' | 'admin'
}

/**
 * Create a test user using admin API (bypasses rate limits)
 */
export async function createTestUser(userData: TestUserCreation): Promise<{
  userId: string
  email: string
}> {
  try {
    // Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email to skip verification
      user_metadata: {
        username: userData.username,
        full_name: userData.fullName || userData.username,
      },
    })

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`)
    }

    const userId = authData.user.id

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        username: userData.username,
        full_name: userData.fullName || userData.username,
        role: userData.role || 'member',
      })

    if (profileError) {
      // If profile creation fails, clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    return {
      userId,
      email: userData.email,
    }
  } catch (error: any) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }
}

/**
 * Delete a test user using admin API
 */
export async function deleteTestUser(userId: string): Promise<void> {
  try {
    // Delete profile first (cascade should handle it, but being explicit)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)
    
    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      console.warn(`Failed to delete auth user ${userId}: ${error.message}`)
    }
  } catch (error: any) {
    console.warn(`Failed to delete test user ${userId}: ${error.message}`)
  }
}

/**
 * Create or get existing test user
 */
export async function getOrCreateTestUser(userData: TestUserCreation): Promise<{
  userId: string
  email: string
}> {
  try {
    // Try to find existing user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers.users.find((u) => u.email === userData.email)

    if (existingUser) {
      // User exists, update password if needed
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: userData.password,
        user_metadata: {
          username: userData.username,
          full_name: userData.fullName || userData.username,
        },
      })

      // Update profile
      await supabaseAdmin
        .from('profiles')
        .update({
          username: userData.username,
          full_name: userData.fullName || userData.username,
          role: userData.role || 'member',
        })
        .eq('id', existingUser.id)

      return {
        userId: existingUser.id,
        email: userData.email,
      }
    }

    // Create new user
    return await createTestUser(userData)
  } catch (error: any) {
    throw new Error(`Failed to get or create test user: ${error.message}`)
  }
}

