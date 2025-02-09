import { NextRequest } from 'next/server';
import { getUser, updateUser } from '@/app/lib/database/userDatabase';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { 
  VerifyRegistrationResponseOpts,
  VerifiedRegistrationResponse,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { getApiSession } from '@/app/lib/auth/getApiSession';
const rpID = process.env.NEXT_PUBLIC_DOMAIN || 'localhost';
const origin = process.env.NEXT_PUBLIC_ORIGIN || `https://${rpID}`;

interface Authenticator {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
}

/**
 * API Route: Verify Passkey Registration
 * 
 * This endpoint verifies the registration response from the authenticator
 * and stores the credential if valid.
 */

export async function POST(req: NextRequest) {
  const session = await getApiSession();
  const userId = session.userId;

  try {
    const body = await req.json();
    const { registrationResponse } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await getUser(userId);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let verification: VerifiedRegistrationResponse;
    try {
      const expectedChallenge = user.currentChallenge;

      if (!expectedChallenge) {
        return new Response(JSON.stringify({ error: 'No challenge found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      verification = await verifyRegistrationResponse({
        response: registrationResponse as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      } as VerifyRegistrationResponseOpts);
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Failed to verify registration' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return new Response(JSON.stringify({ error: 'Registration verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert the authenticator to our database format
    const authenticator: Authenticator = {
      credentialID: Buffer.from(registrationInfo.credential.id).toString('base64url'),
      credentialPublicKey: Buffer.from(registrationInfo.credential.publicKey).toString('base64url'),
      counter: 0,
    };

    // Store the authenticator info with the user
    await updateUser(user.id, {
      authenticators: [
        ...(user.authenticators || []),
        authenticator,
      ],
      currentChallenge: null,
    });

    return new Response(JSON.stringify({ verified }), {
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
 * 5. Keep credential storage secure
 */ 