/**
 * API Route: Sign Out
 * 
 * This endpoint handles user sign out by clearing
 * the session cookie.
 */

import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    return Response.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
} 