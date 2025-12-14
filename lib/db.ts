import { PrismaClient } from '@prisma/client';

// Singleton pour éviter les multiples instances en développement
declare global {
  var __prisma: PrismaClient | undefined;
}

// Log pour debug
console.log('🔍 [DB] DATABASE_URL length:', process.env.DATABASE_URL?.length || 'undefined');

export const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}