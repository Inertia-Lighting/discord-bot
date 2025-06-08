// import { createHmac } from 'node:crypto';

import { PrismaClient } from './prisma';


// import SnowflakeGenerator from './SnowflakeGenerator';v

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

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
    errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
// const snowflakeGenerator = new SnowflakeGenerator(929);

export default prisma;