import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { SAML, SamlConfig } from '@node-saml/node-saml';

/**
 * API Route: SAML Authentication
 * 
 * This endpoint handles SAML authentication:
 * 1. Verifies the SAML response
 * 2. Creates or updates the user
 * 3. Creates a session
 */

const samlConfig: SamlConfig = {
  callbackUrl: process.env.NEXT_PUBLIC_ORIGIN + '/api/auth/saml/callback',
  entryPoint: process.env.SAML_ENTRY_POINT!,
  issuer: process.env.SAML_ISSUER!,
  idpCert: process.env.SAML_CERT!,
  validateInResponseTo: undefined,
  disableRequestedAuthnContext: true,
};

const saml = new SAML(samlConfig);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const samlResponse = formData.get('SAMLResponse');

    if (!samlResponse || typeof samlResponse !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing SAML response' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // Verify the SAML response
      const { profile } = await saml.validatePostResponseAsync({
        SAMLResponse: samlResponse,
      });

      if (!profile?.nameID || !profile?.email) {
        throw new Error('Invalid SAML profile');
      }

      const db = getDatabase();
      let user = await db.getUserByEmail(profile.email);
      let isNewUser = false;

      if (!user) {
        // Create new user
        const displayName = typeof profile.displayName === 'string' ? profile.displayName : profile.email.split('@')[0];
        user = await db.createUser({
          email: profile.email,
          name: displayName,
          emailVerified: true, // SAML providers verify emails
          organizations: [],
        });
        isNewUser = true;
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
        isNewUser,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session=${sessionId}; Max-Age=${expiresIn}; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax`,
        },
      });
    } catch (error) {
      console.error('SAML auth error:', error);
      return new Response(JSON.stringify({ error: 'Invalid SAML response' }), {
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

export async function GET() {
  try {
    // Generate SAML request URL
    const requestId = uuidv4();
    const redirectUrl = await saml.getAuthorizeUrlAsync(
      requestId, 
      process.env.NEXT_PUBLIC_ORIGIN + '/api/auth/saml/callback',
      {}
    );
    
    return new Response(JSON.stringify({ 
      url: redirectUrl,
      id: requestId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SAML request error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate SAML request' }), {
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