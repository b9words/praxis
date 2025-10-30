import { createClient } from '@/lib/supabase/server'

/**
 * Get the current authenticated user from Supabase Auth
 * Returns the user ID which can be used with Prisma queries
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
  }
}

