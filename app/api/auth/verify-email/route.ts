import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { verifyOTP } from '@/app/lib/auth/emailOTP';

/**
 * API Route: Verify Email
 * 
 * This endpoint verifies a user's email address using
 * the provided OTP code.
 */

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const db = getDatabase();
      const user = await db.getUser(userId);

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Verify the OTP code
      const isValid = await verifyOTP(userId, code);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update user's email verification status
      await db.updateUser(userId, { emailVerified: true });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Email verification error:', error);
      return new Response(JSON.stringify({ error: 'Failed to verify email' }), {
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
 * 5. Keep verification state secure
 */ 