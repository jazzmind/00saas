import { v4 as uuidv4 } from 'uuid';
import { getUser } from './database/userDatabase';
import { createSessionJWT, setSessionCookie } from './auth/jwt';
import { 
  createSessionInDb, 
  getSessionFromDb,
  deleteSessionFromDb,
  updateSessionLastAccessed 
} from './database/sessionDatabase';
import type { SessionData } from './types';


export async function createSession(userId: string, userAgent: string | null, ip: string | null) {
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');

  const sessionId = uuidv4();
  const now = new Date();
  const session: SessionData = {
    id: sessionId,
    userId,
    organizationId: user.organizations?.[0]?.organizationId || null,
    createdAt: now,
    lastAccessedAt: now,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: userAgent || null,
    ip: ip || null
  };

  // Store session in database
  await createSessionInDb(session);

  // Create JWT and set cookie
  const jwt = await createSessionJWT({
    userId,
    organizationId: session.organizationId || null,
    sessionId
  });

  setSessionCookie(jwt);
  return { sessionId, jwt };
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const session = await getSessionFromDb(sessionId);
  if (!session) return null;

  // Check if session has expired
  if (new Date() > new Date(session.expiresAt)) {
    await deleteSessionFromDb(sessionId);
    return null;
  }

  // Update last accessed timestamp
  await updateSessionLastAccessed(sessionId);
  return session;
}

export async function deleteSession(sessionId: string) {
  await deleteSessionFromDb(sessionId);
}

// Add this for API routes that need to validate sessions
export async function validateSession(sessionId: string): Promise<SessionData | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  // Session is valid and not expired
  return session;
} 