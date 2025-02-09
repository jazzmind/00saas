import { NextRequest } from "next/server";
import { getUser } from "@/app/lib/database/userDatabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user by email
    const user = await getUser(email);
    
    if (!user) {
      // Don't reveal if user exists, just return no passkey
      return new Response(JSON.stringify({ 
        hasPasskey: false 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has any passkeys registered
    const passkeys = user.authenticators;
    
    return new Response(JSON.stringify({
      hasPasskey: passkeys && passkeys.length > 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Passkey status check error:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(JSON.stringify({ 
      error: 'Failed to check passkey status' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
