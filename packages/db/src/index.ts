/**
 * The shared Prisma client.
 *
 * VT-109, Het (PT-1) owns this package.
 *
 * The singleton below is not ceremony. Next.js reloads modules on every edit in
 * development, and a fresh PrismaClient per reload opens a fresh pool of
 * database connections that is never closed. After twenty saves PostgreSQL
 * starts refusing connections and it looks like a database fault. Caching the
 * client on `globalThis` is the standard fix.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export * from '@prisma/client'
