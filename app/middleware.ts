import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initDatabase } from './lib/database/init';

let initialized = false;

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/') && !initialized) {
    await initDatabase();
    initialized = true;
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}
