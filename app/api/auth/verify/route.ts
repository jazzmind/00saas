import { NextRequest } from "next/server";
import { getUser, updateUser } from "@/lib/database/userDatabase";
import { verifyOTP, verifyToken } from "@/lib/auth/emailOTP";

/**
 * API Route: Verify Email
 *
 * This endpoint verifies a user's email address using
 * the provided OTP code.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, code, email } = body;

    let verificationResult;

    if (token) {
      try {
        verificationResult = await verifyToken(token);
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Verification failed' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (code && email) {
      try {
        verificationResult = await verifyOTP(email, code);
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Verification failed' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle successful verification
    if (verificationResult.purpose === 'signup' || verificationResult.purpose === 'verification') {
      try {
        await updateUser(verificationResult.userId, { emailVerified: true });
      } catch (error) {
        console.error('Email verification error:', error);
        return new Response(JSON.stringify({ error: 'Failed to verify email' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Get user info
    const user = await getUser(verificationResult.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine redirect path based on verification purpose
    let redirectPath = verificationResult.redirectPath || '/dashboard';
    
    // If user has no organizations, redirect to org creation
    if (!user.organizations?.length) {
      redirectPath = '/admin/organizations/new';
    }

    let hasPasskey = false;
    if (user.authenticators && user.authenticators.length > 0) {
      hasPasskey = true;
    }

    return new Response(JSON.stringify({
      user: {
        id: verificationResult.userId,
        email: verificationResult.email,
      },
      hasPasskey,
      redirectPath,
      isNewUser: verificationResult.purpose === 'signup'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(JSON.stringify({ error: 'Invalid request format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
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
