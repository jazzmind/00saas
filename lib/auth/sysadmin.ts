import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/database/userDatabase';

/**
 * Sysadmin Authentication Module
 * 
 * This module handles sysadmin authentication and authorization.
 * Sysadmins are determined by their email addresses matching the SYSADMIN_EMAILS env variable.
 * They must verify with an OTP every 60 minutes.
 */

// Parse sysadmin emails from environment variable
const getSysadminEmails = () => {
  const emails = process.env.SYSADMIN_EMAILS?.split(',') || [];
  return new Set(emails.map(email => email.trim().toLowerCase()));
};

export function isSysadmin(email: string): boolean {
  const sysadminEmails = getSysadminEmails();
  return sysadminEmails.has(email.toLowerCase());
}

export async function verifySysadminSession(userId: string): Promise<boolean> {
  try {
    const session = await getUser(userId);
    if (!session) return false;

    const now = new Date();
    const lastVerified = session.updatedAt;
    
    // Check if verification is expired (60 minutes)
    const minutesSinceVerification = (now.getTime() - lastVerified.getTime()) / (1000 * 60);
    return minutesSinceVerification <= 60;
  } catch (error) {
    console.error('Error verifying sysadmin session:', error);
    return false;
  }
}

export async function requireSysadmin(req: NextRequest) {
  const session = req.cookies.get('session');
  if (!session) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get user from session

  const sessionUser = await getUser(session.value);
  if (!sessionUser) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if user is a sysadmin
  if (!isSysadmin(sessionUser.email)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if sysadmin session is valid
  const isValid = await verifySysadminSession(sessionUser.id);
  if (!isValid) {
    return new NextResponse(JSON.stringify({ error: 'Verification required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null; // Indicates success
}

/**
 * @note For AI Agents:
 * When extending this module:
 * 1. Keep security as the top priority
 * 2. Implement proper error handling
 * 3. Add logging for security events
 * 4. Consider rate limiting
 * 5. Keep session management secure
 */ 