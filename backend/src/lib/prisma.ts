import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * Singleton Prisma Client instance
 * 
 * This prevents multiple instances of PrismaClient from being created,
 * which can lead to connection pool exhaustion in production.
 * 
 * In development, the instance is stored in globalThis to prevent
 * creating new instances during hot module reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

