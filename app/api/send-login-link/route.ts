import { NextRequest } from 'next/server';
import { sendOTP } from '@/app/lib/auth/emailOTP';

/**
 * API Route: Send Login Link
 * 
 * This endpoint handles sending login links via email.
 * It's used as a fallback when passkeys are not available.
 */

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    await sendOTP({ 
      email: email.trim(), 
      purpose: 'login',
      redirectPath: '/dashboard'
    });
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending login link:', error);
    return Response.json(
      { error: 'Failed to send login link' }, 
      { status: 500 }
    );
  }
}