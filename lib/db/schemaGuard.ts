import { prisma } from '@/lib/prisma/server'

/**
 * Check if we're in development mode
 */
function isDev(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if a table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `
    return result[0]?.exists || false
  } catch (error) {
    console.error(`Error checking table existence for ${tableName}:`, error)
    return false
  }
}

/**
 * Check if a column exists in a table
 */
export async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      ) as exists
    `
    return result[0]?.exists || false
  } catch (error) {
    console.error(`Error checking column existence for ${tableName}.${columnName}:`, error)
    return false
  }
}

/**
 * Ensure notifications table exists (dev only)
 * Creates the table with required indexes if missing
 */
export async function ensureNotificationsTable(): Promise<void> {
  if (!isDev()) {
    return // Never mutate schema in production
  }

  try {
    const exists = await tableExists('notifications')
    if (exists) {
      return
    }

    // Ensure uuid extension exists (for gen_random_uuid)
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
    } catch {
      // Extension might already exist or not available - continue anyway
    }

    // Create table using TEXT for type column (matching Prisma schema)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        type text NOT NULL,
        title text NOT NULL,
        message text NOT NULL,
        link text,
        metadata jsonb NOT NULL DEFAULT '{}',
        read boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)

    // Create indexes separately (IF NOT EXISTS for each)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
    `).catch(() => {}) // Ignore if already exists
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
    `).catch(() => {})
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
    `).catch(() => {})
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
    `).catch(() => {})

    console.log('Notifications table created successfully')
  } catch (error) {
    console.error('Failed to create notifications table:', error)
    // Don't throw - let the route handle it gracefully
  }
}

/**
 * Ensure user_lesson_progress table exists (dev only)
 * Creates the table with required indexes if missing
 */
export async function ensureUserLessonProgressTable(): Promise<void> {
  if (!isDev()) {
    return // Never mutate schema in production
  }

  try {
    const exists = await tableExists('user_lesson_progress')
    if (exists) {
      return
    }

    // Ensure uuid extension exists
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
    } catch {
      // Extension might already exist - continue anyway
    }

    // Create table matching Prisma schema
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        domain_id text NOT NULL,
        module_id text NOT NULL,
        lesson_id text NOT NULL,
        status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
        progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
        time_spent_seconds integer NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
        last_read_position jsonb DEFAULT '{}'::jsonb,
        completed_at timestamptz,
        bookmarked boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id, domain_id, module_id, lesson_id)
      );
    `)

    // Create indexes separately (IF NOT EXISTS for each)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
    `).catch(() => {})
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_domain_module_lesson ON public.user_lesson_progress(domain_id, module_id, lesson_id);
    `).catch(() => {})
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_status ON public.user_lesson_progress(status);
    `).catch(() => {})
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_status ON public.user_lesson_progress(user_id, status);
    `).catch(() => {})

    console.log('User lesson progress table created successfully')
  } catch (error) {
    console.error('Failed to create user_lesson_progress table:', error)
    // Don't throw - let the route handle it gracefully
  }
}

/**
 * Ensure user_article_progress table exists (dev only)
 * Creates the table with required indexes if missing
 */
export async function ensureUserArticleProgressTable(): Promise<void> {
  if (!isDev()) {
    return // Never mutate schema in production
  }

  try {
    const exists = await tableExists('user_article_progress')
    if (exists) {
      return
    }

    // Ensure uuid extension exists
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
    } catch {
      // Extension might already exist - continue anyway
    }

    // Create table matching Prisma schema
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.user_article_progress (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
        status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
        completed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id, article_id)
      );
    `)

    // Create indexes separately (IF NOT EXISTS for each)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_article_progress_user_id ON public.user_article_progress(user_id);
    `).catch(() => {})
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_article_progress_article_id ON public.user_article_progress(article_id);
    `).catch(() => {})
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_user_article_progress_status ON public.user_article_progress(status);
    `).catch(() => {})

    console.log('User article progress table created successfully')
  } catch (error) {
    console.error('Failed to create user_article_progress table:', error)
    // Don't throw - let the route handle it gracefully
  }
}

