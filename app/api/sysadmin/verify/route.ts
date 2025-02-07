import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { verifyOTP } from '@/app/lib/auth/emailOTP';
import { isSysadmin } from '@/app/lib/auth/sysadmin';

/**
 * Sysadmin API: Verify OTP
 * 
 * This endpoint handles the 60-minute OTP verification requirement for sysadmins.
 * It verifies the OTP and updates the sysadmin session.
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

    const db = getDatabase();
    const user = await db.getUser(userId);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user is a sysadmin
    if (!isSysadmin(user.email)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the OTP
    const isValid = await verifyOTP(userId, code);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user's last verification time
    await db.updateUser(userId, {
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sysadmin verification:', error);
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