import { NextRequest } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/database/userDatabase';
import { sendOTP } from '@/lib/auth/emailOTP';

/**
 * API Route: Sign Up
 * 
 * This endpoint handles new user registration and sends
 * a verification email to the user.
 */

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Create new user with name derived from email
    const name = email.split('@')[0];
    const user = await createUser(email, name);
    
    if (!user || !user.id) {
      throw new Error('Failed to create user record');
    }

    // Send verification email with the user ID
    await sendOTP({
      email: user.email,
      purpose: 'signup',
      redirectPath: '/admin/organization/new',
      userId: user.id  // Make sure we pass the user ID
    });

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      }
    });

  } catch (error) {
    // Log the actual error for debugging
    console.error('Signup error:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return a generic error to the client
    return Response.json(
      { error: 'Failed to process signup' }, 
      { status: 500 }
    );
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