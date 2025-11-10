import { prisma } from '@/lib/prisma/server'

/**
 * Check if a table exists in the connected Postgres database.
 * Uses information_schema which is portable across environments.
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<
      Array<{ exists: boolean }>
    >`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ${tableName}) as exists`
    return !!result?.[0]?.exists
  } catch {
    return false
  }
}






