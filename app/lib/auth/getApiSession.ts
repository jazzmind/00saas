import { headers } from 'next/headers';

interface SessionData {
  userId: string;
  organizationId?: string;
  sessionId: string;
}

export async function getApiSession(): Promise<SessionData> {
  const headersList = await headers();
  const sessionData = headersList.get('x-session-data');
  
  if (!sessionData) {
    throw new Error('Unauthorized');
  }

  try {
    return JSON.parse(sessionData);
  } catch {
    throw new Error('Invalid session data');
  }
} 