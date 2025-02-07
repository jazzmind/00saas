import { NextRequest } from 'next/server';
import { getUserByEmail, createUser } from '@/app/lib/database/userDatabase';
import { sendOTP } from '@/app/lib/auth/emailOTP';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase } from '@/app/lib/database/init';

/**
 * API Route: Sign Up
 * 
 * This endpoint handles new user registration and sends
 * a verification email to the user.
 */

export async function POST(req: NextRequest) {
  try {
    // Initialize database for API route
    await initDatabase();

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    try {
   
      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'Email already in use' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create new user
      const user = await createUser(email, 'owner');

      // Send verification email
      await sendOTP({
        email: user.email,
        purpose: 'verification',
        redirectPath: '/dashboard'
      });

      // Create a session
      const sessionId = uuidv4();
      const expiresIn = 30 * 24 * 60 * 60 * 1000; // 30 days

      return new Response(JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
        isNewUser: true,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session=${sessionId}; Max-Age=${expiresIn}; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax`,
        },
      });
    } catch (error) {
      console.error('Sign up error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 400,
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