import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { verifyOTP } from '@/app/lib/auth/emailOTP';
import { v4 as uuidv4 } from 'uuid';

/**
 * API Route: Verify Signup
 * 
 * This endpoint:
 * 1. Verifies the OTP code
 * 2. Creates a new user
 * 3. Creates a new organization
 * 4. Sets up a free trial
 */

export async function POST(req: NextRequest) {
  try {
    const { userId, email, code } = await req.json();

    if (!userId || !email || !code) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
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

    const db = getDatabase();

    // Create the organization with a free trial
    const orgName = email.split('@')[0] + "'s Organization";
    const organization = await db.createOrganization({
      name: orgName,
      slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      plan: 'free',
      members: [],
      settings: {
        allowedAuthMethods: ['passkey', 'google', 'apple', 'microsoft', 'saml'],
        requireMFA: false,
      },
    });

    // Create the membership
    await db.createMembership({
      userId,
      organizationId: organization.id,
      role: 'owner',
    });

    // Create a session
    const sessionId = uuidv4();
    const expiresIn = 30 * 24 * 60 * 60; // 30 days

    // Return success with session
    return new Response(JSON.stringify({
      success: true,
      session: {
        id: sessionId,
        user: {
          id: userId,
          email,
          emailVerified: true,
        },
        organization,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax; Max-Age=${expiresIn}`,
      },
    });
  } catch (error) {
    console.error('Error in signup verification:', error);
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