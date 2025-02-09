import { NextRequest } from "next/server";
import { getSession, createSession } from "@/app/lib/session";
import { verifyJWT, createSessionJWT, setSessionCookie } from "@/app/lib/auth/jwt";

// Get current session info
export async function GET(req: NextRequest) {
  const sessionJWT = req.cookies.get('session')?.value;
  
  if (!sessionJWT) {
    return new Response(null, { status: 401 });
  }

  const payload = await verifyJWT(sessionJWT);
  if (!payload) {
    return new Response(null, { status: 401 });
  }

  const session = await getSession(payload.sessionId);
  if (!session) {
    return new Response(null, { status: 401 });
  }

  // Create new JWT
  const newJWT = await createSessionJWT({
    userId: session.userId,
    organizationId: session.organizationId,
    sessionId: session.id
  });

  setSessionCookie(newJWT);

  return new Response(JSON.stringify({
    user: {
      id: session.userId,
      organizationId: session.organizationId
    },
    jwt: newJWT
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Create new session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Creating session with body:', {
      ...body,
      userAgent: body.userAgent?.substring(0, 50) // Truncate for logging
    });
    
    const { userId, userAgent, ip } = body;
    
    if (!userId) {
      console.warn('Session creation failed: Missing userId');
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create new session with request metadata
    const { jwt } = await createSession(userId, userAgent, ip);
    
    if (!jwt) {
      console.error('Session creation failed: No JWT returned');
      return new Response(JSON.stringify({ 
        error: 'Failed to create session' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Session created successfully for user:', userId);
    return new Response(JSON.stringify({ 
      success: true,
      jwt 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Safe error logging that handles null/undefined
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('Session creation failed:', {
      name: errorName,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Refresh existing session
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { jwt: oldJWT } = body;

    if (!oldJWT) {
      return new Response(null, { status: 401 });
    }

    const payload = await verifyJWT(oldJWT);
    if (!payload) {
      return new Response(null, { status: 401 });
    }

    const session = await getSession(payload.sessionId);
    if (!session) {
      return new Response(null, { status: 401 });
    }

    // Create new JWT
    const newJWT = await createSessionJWT({
      userId: session.userId,
      organizationId: session.organizationId,
      sessionId: session.id
    });

    // Set the new cookie
    setSessionCookie(newJWT);

    return new Response(JSON.stringify({ 
      success: true,
      jwt: newJWT 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    return new Response(null, { status: 500 });
  }
} 