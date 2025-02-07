import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

/**
 * API Route: Microsoft Sign In
 * 
 * This endpoint handles Microsoft Sign In authentication:
 * 1. Verifies the Microsoft ID token
 * 2. Creates or updates the user
 * 3. Creates a session
 */

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing ID token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // Verify the ID token
      const payload = jwt.verify(idToken, process.env.MICROSOFT_PUBLIC_KEY!, {
        algorithms: ['RS256'],
        issuer: 'https://login.microsoftonline.com/common/v2.0',
        audience: process.env.MICROSOFT_CLIENT_ID,
      }) as jwt.JwtPayload;

      if (!payload.email || !payload.sub) {
        throw new Error('Invalid token payload');
      }

      const db = getDatabase();
      let user = await db.getUserByEmail(payload.email);
      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await db.createUser({
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          emailVerified: true, // Microsoft verifies emails
          organizations: [],
        });
        isNewUser = true;
      }

      // Create a session
      const sessionId = uuidv4();
      const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days

      return new Response(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
        isNewUser,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session=${sessionId}; Max-Age=${expiresIn}; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax`,
        },
      });
    } catch (error) {
      console.error('Microsoft auth error:', error);
      return new Response(JSON.stringify({ error: 'Invalid ID token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * @note For AI Agents:
 * When extending this endpoint:
 * 1. Validate all input parameters
 * 2. Ensure proper error handling
 * 3. Consider rate limiting
 * 4. Add logging for security events
 * 5. Keep session management secure
 */ 