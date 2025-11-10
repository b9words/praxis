import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase admin client using service role key
 * This allows programmatic user creation and management
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
  }

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Create or get a test user for E2E tests
 * Returns the user ID
 */
export async function createOrGetTestUser(
  email: string = 'e2e.user@execemy.test',
  password: string = 'Test1234!',
  username: string = 'e2e_user'
): Promise<string> {
  const supabaseAdmin = createAdminClient()

  // Check if user already exists
  const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`)
  }

  const existingUser = existingUsers.users.find((u) => u.email === email)

  if (existingUser) {
    // Update existing user to ensure password and metadata are correct
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          username,
          full_name: username.charAt(0).toUpperCase() + username.slice(1),
        },
      }
    )

    if (updateError || !updatedUser.user) {
      throw new Error(`Failed to update user: ${updateError?.message}`)
    }

    // Ensure profile exists
    await ensureProfileExists(supabaseAdmin, updatedUser.user.id, username)

    return updatedUser.user.id
  }

  // Create new user
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Bypass email confirmation for tests
    user_metadata: {
      username,
      full_name: username.charAt(0).toUpperCase() + username.slice(1),
    },
  })

  if (createError || !newUser.user) {
    throw new Error(`Failed to create user: ${createError?.message}`)
  }

  // Ensure profile exists
  await ensureProfileExists(supabaseAdmin, newUser.user.id, username)

  return newUser.user.id
}

/**
 * Ensure a profile exists for the user
 */
async function ensureProfileExists(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  userId: string,
  username: string
): Promise<void> {
  // Check if profile exists
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!existingProfile) {
    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        username,
        full_name: username.charAt(0).toUpperCase() + username.slice(1),
        role: 'member',
        is_public: false,
      })

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    // Wait a bit for profile to be available
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

/**
 * Delete test user (cleanup)
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    console.warn(`Failed to delete test user ${userId}: ${error.message}`)
  }
}






