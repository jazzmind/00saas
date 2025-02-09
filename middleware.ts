import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './app/lib/auth/jwt';

// Add paths that are publicly accessible without auth
const publicPaths = [
  // Auth-related paths
  '/login',
  '/signup',
  '/verify',
  '/magiclink',
  
  // Static assets and public resources
  '/_next',
  '/favicon.ico',
  '/logo',
  '/public',
  
  // Public pages
  '/',
  '/about',
  '/contact',
  
  // Health checks
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const sessionJWT = request.cookies.get('session')?.value;
  
  // No session cookie, handle as unauthenticated
  if (!sessionJWT) {
    return handleUnauthenticated(request);
  }

  // Verify JWT
  const payload = await verifyJWT(sessionJWT);
  
  // JWT is invalid or expired
  if (!payload) {
    // Try to refresh session if it exists
    if (sessionJWT) {
      return await handleSessionRefresh(request, sessionJWT);
    }
    return handleUnauthenticated(request);
  }

  // Create response with authenticated context
  const requestHeaders = new Headers(request.headers);
  
  if (pathname.startsWith('/api/')) {
    // For API routes, set Authorization header with JWT
    requestHeaders.set('Authorization', `Bearer ${sessionJWT}`);
    requestHeaders.set('x-session-data', JSON.stringify({
      userId: payload.userId,
      organizationId: payload.organizationId,
      sessionId: payload.sessionId
    }));
  } else {
    // For pages, set user context in headers
    requestHeaders.set('x-user-id', payload.userId);
    if (payload.organizationId) {
      requestHeaders.set('x-organization-id', payload.organizationId);
    }
  }

  // Add the current path to headers for layouts
  requestHeaders.set('x-pathname', pathname);


  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

async function handleSessionRefresh(request: NextRequest, oldJWT: string) {
  try {
    const response = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
      method: 'PUT',
      body: JSON.stringify({
        'jwt': oldJWT
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return handleUnauthenticated(request);
    }

    const data = await response.json();
    const newResponse = NextResponse.next();
    
    // Use the new JWT from the response
    if (data.jwt) {
      newResponse.cookies.set('session', data.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    return newResponse;

  } catch (error) {
    console.error('Session refresh error:', error);
    return handleUnauthenticated(request);
  }
}

function handleUnauthenticated(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a protected route
  if (!publicPaths.some(path => pathname.startsWith(path))) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure paths that should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 