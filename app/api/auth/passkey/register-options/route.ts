import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { GenerateRegistrationOptionsOpts } from '@simplewebauthn/server';

const rpName = '00SaaS';
const rpID = process.env.NEXT_PUBLIC_DOMAIN || 'localhost';

/**
 * API Route: Generate Passkey Registration Options
 * 
 * This endpoint generates the options needed to register a new passkey
 * for a user. It follows the WebAuthn specification for credential creation.
 */

export async function POST(req: NextRequest) {
  try {
    const { userId, username, displayName } = await req.json();

    if (!userId || !username || !displayName) {
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

    // Get existing authenticators
    const excludeCredentials = (user.authenticators || []).map(authenticator => ({
      id: authenticator.credentialID,
      type: 'public-key' as const,
    }));

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: username,
      userDisplayName: displayName,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    } satisfies GenerateRegistrationOptionsOpts);

    // Store challenge with user
    await db.updateUser(userId, {
      currentChallenge: options.challenge,
    });

    return new Response(JSON.stringify(options), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
 * 5. Keep challenge storage secure
 */ 