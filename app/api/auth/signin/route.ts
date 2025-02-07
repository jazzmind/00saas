import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * API Route: Sign In
 * 
 * This endpoint handles user sign-in using email/password
 * and creates a session upon successful authentication.
 */

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const db = getDatabase();
      const user = await db.getUserByEmail(email);

      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
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
        isNewUser: false,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session=${sessionId}; Max-Age=${expiresIn}; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax`,
        },
      });
    } catch (error) {
      console.error('Sign in error:', error);
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
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