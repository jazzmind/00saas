import { auth as getAuth } from "@/app/api/auth/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function authMiddleware(request: NextRequest) {
  const auth = await getAuth()
  const isLoggedIn = !!auth
  
  const { pathname } = request.nextUrl
  const isPublicPath = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify') ||
    pathname === '/'

  // Auth flow paths
  const isAuthFlow = 
    pathname.startsWith('/passkey') ||
    pathname.startsWith('/admin/organizations/new')

  if (!isLoggedIn && !isPublicPath) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return null
} 