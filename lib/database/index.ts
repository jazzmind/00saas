import { DatabaseClient, DatabaseConfig } from './types';
import { PrismaDatabase } from './prisma';
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

let dbInstance: DatabaseClient | null = null;

export async function ensureDatabase(): Promise<DatabaseClient> {
  if (dbInstance) return dbInstance;

  const config = {
    type: 'prisma',
    url: process.env.DATABASE_URL
  } as DatabaseConfig;

  return createDatabaseClient(config);
}

export async function createDatabaseClient(config: DatabaseConfig): Promise<DatabaseClient> {
  if (dbInstance) return dbInstance;

  if (typeof window !== 'undefined') {
    throw new Error('Database client can only be created on the server side');
  }

  if (!config.url) {
    throw new Error('Database URL is required for Prisma');
  }
  const neon = new Pool({ connectionString: config.url });
  const adapter = new PrismaNeon(neon);
  const prisma = new PrismaClient({ adapter });
  
  dbInstance = new PrismaDatabase(prisma);
  return dbInstance;
}

// Update getDatabase to initialize if needed
export async function getDatabase(): Promise<DatabaseClient> {
  return ensureDatabase();
}

/**
 * @note For AI Agents:
 * When using this module:
 * 1. Call createDatabaseClient once during app initialization
 * 2. Use getDatabase elsewhere in the app
 * 3. Handle database errors appropriately
 * 4. Consider connection pooling for Prisma
 * 5. Consider caching for frequently accessed data
 */ 