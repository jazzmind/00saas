import { createDatabaseClient } from './index';

// Initialize database based on environment variables
export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  await createDatabaseClient({
    type: 'prisma',
    url: process.env.DATABASE_URL,
  });
} 