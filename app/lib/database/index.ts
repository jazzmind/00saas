import { DatabaseClient, DatabaseConfig } from './types';
import { FirebaseDatabase } from './firebase';
import { PrismaDatabase } from './prisma';
import { PrismaClient } from '@prisma/client';

let dbInstance: DatabaseClient | null = null;

export async function ensureDatabase(): Promise<DatabaseClient> {
  if (dbInstance) return dbInstance;

  const config = {
    type: process.env.DATABASE_TYPE as 'firebase' | 'prisma',
    url: process.env.DATABASE_URL
  };

  return createDatabaseClient(config);
}

export async function createDatabaseClient(config: DatabaseConfig): Promise<DatabaseClient> {
  if (dbInstance) return dbInstance;

  if (typeof window !== 'undefined') {
    throw new Error('Database client can only be created on the server side');
  }

  switch (config.type) {
    case 'firebase':
      // Dynamic import to avoid client-side bundling
      const { getApps, initializeApp, cert } = await import('firebase-admin/app');
      // const { getAuth } = await import('firebase-admin/auth');
      const { getFirestore } = await import('firebase-admin/firestore');
      // Initialize Firebase Admin if not already initialized
      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
      dbInstance = new FirebaseDatabase(getFirestore());
      break;
    case 'prisma':
      if (!config.url) {
        throw new Error('Database URL is required for Prisma');
      }
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: config.url,
          },
        },
      });
      dbInstance = new PrismaDatabase(prisma);
      break;
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }

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