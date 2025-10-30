import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a custom Prisma client that suppresses internal error logging
class SilentPrismaClient extends PrismaClient {
  constructor() {
    super({
      // Completely disable Prisma logging
      log: [],
      errorFormat: 'minimal',
    })
    
    // Note: Prisma doesn't expose error events in the public API
    // Error suppression is handled in our error handling functions
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new SilentPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

