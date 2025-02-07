import { createDatabaseClient } from './index';

// Initialize database based on environment variables
export async function initDatabase() {
  const dbType = process.env.DATABASE_TYPE as 'firebase' | 'prisma';
  if (!dbType) {
    throw new Error('DATABASE_TYPE environment variable not set');
  }

  await createDatabaseClient({
    type: dbType,
    url: process.env.DATABASE_URL,
  });
} 