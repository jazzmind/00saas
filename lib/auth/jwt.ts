import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Make sure JWT_SECRET is properly encoded
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_secret_for_development_only'
);

const SESSION_COOKIE = 'session';
const JWT_EXPIRES_IN = '5m';
const SESSION_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

interface JWTPayload {
  userId: string;
  organizationId?: string | null;
  sessionId: string;
  exp?: number;
  iat?: number;
}

export async function createSessionJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>) {
  try {
    const jwt = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(JWT_SECRET);

    return jwt;
  } catch (error) {
    console.error('JWT creation error:', error);
    throw new Error('Failed to create session token');
  }
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    if (!token || typeof token !== 'string') {
      console.warn('Invalid token format:', { token });
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });

    return payload as unknown as JWTPayload;
  } catch (error) {
    if (error instanceof Error) {
      console.error('JWT verification error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    } else {
      console.error('Unknown JWT verification error:', error);
    }
    return null;
  }
}

export async function setSessionCookie(jwt: string) {
  if (!jwt || typeof jwt !== 'string') {
    console.error('Invalid JWT for cookie:', { jwt });
    throw new Error('Invalid session token');
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRES_IN,
    path: '/',
  });
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
} 