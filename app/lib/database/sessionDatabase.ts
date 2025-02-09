import { getDatabase } from './index';
import type { SessionData } from '@/app/lib/types';

export async function createSessionInDb(session: SessionData) {
  const db = await getDatabase();
  await db.createSession({
    id: session.id,
    userId: session.userId,
    organizationId: session.organizationId || null  ,
    createdAt: session.createdAt,
    lastAccessedAt: session.lastAccessedAt,
    expiresAt: session.expiresAt,
    userAgent: session.userAgent || null,
    ip: session.ip || null
  });
}

export async function getSessionFromDb(sessionId: string) {
  const db = await getDatabase();
  const session = await db.getSession(sessionId);
  if (!session) return null;

  return {
    id: session.id,
    userId: session.userId,
    organizationId: session.organizationId || null,
    createdAt: session.createdAt,
    lastAccessedAt: session.lastAccessedAt,
    expiresAt: session.expiresAt,
    userAgent: session.userAgent || null,
    ip: session.ip || null
  };
}

export async function updateSessionLastAccessed(sessionId: string) {
  const db = await getDatabase();
  await db.updateSession(sessionId, {
    lastAccessedAt: new Date()
  });
}

export async function deleteSessionFromDb(sessionId: string) {
  const db = await getDatabase();
  await db.deleteSession(sessionId);
}

export async function cleanupExpiredSessionsInDb() {
  const db = await getDatabase();
  await db.deleteExpiredSessions();
}

export async function updateSessionExpiry(
  sessionId: string, 
  newExpiryDate: Date
): Promise<void> {
  const db = await getDatabase();
  await db.updateSession(sessionId, {
    expiresAt: newExpiryDate,
    lastAccessedAt: new Date()
  });
}
