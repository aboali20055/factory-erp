import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Singleton pattern: prevents multiple Prisma client instances in development (hot reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});
