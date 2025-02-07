import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Authentication Middleware
 * 
 * This middleware:
 * 1. Redirects authenticated users away from auth pages
 * 2. Redirects unauthenticated users to login
 * 3. Handles session validation
 */

// Pages that don't require authentication
const publicPages = ['/login', '/signup'];

// Pages that are only accessible to unauthenticated users
const authPages = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api/') || pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  let isAuthenticated = false;
  if (session?.value) {
    try {
      const response = await fetch(new URL('/api/check-auth', request.url), {
        headers: {
          Cookie: `session=${session.value}`,
        },
      });
      isAuthenticated = response.ok;
    } catch (error) {
      // Invalid session
      console.error('Session verification failed:', error);
      isAuthenticated = false;
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authPages.includes(pathname)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !publicPages.includes(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/ (API routes)
     * 2. /_next/ (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}; 