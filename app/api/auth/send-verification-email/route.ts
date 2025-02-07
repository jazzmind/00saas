import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { sendOTP } from '@/app/lib/auth/emailOTP';

/**
 * API Route: Send Verification Email
 * 
 * This endpoint handles sending email verification codes.
 */

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get('session');
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDatabase();
    const user = await db.getUser(session.value);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (user.emailVerified) {
      return new Response(JSON.stringify({ error: 'Email already verified' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send verification OTP
    await sendOTP({
      email: user.email,
      purpose: 'verification',
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 