import { PrismaPg } from '@prisma/adapter-pg'
import { env } from 'prisma/config'

import { PrismaClient } from '@/lib/prisma/client.js'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const connectionString = env('DATABASE_URL')

const adapter = new PrismaPg({ connectionString }, { schema: 'inertia_main' })

const prisma =
  globalForPrisma.prisma || new PrismaClient({
    log: ['error', 'info', 'warn'],
    omit: {
        user: {
            createdAt: true,
            updatedAt: true
        },
        products: {
            id: true,
            updatedAt: true
        },
        punishments: {
            id: true,
        },
    },
    adapter,
    errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
// const snowflakeGenerator = new SnowflakeGenerator(929);

export default prisma;