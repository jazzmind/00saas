/**
 * API Route: Sign Out
 * 
 * This endpoint handles user sign out by clearing
 * the session cookie.
 */

export async function POST() {
  try {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=; Max-Age=0; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Lax`,
      },
    });
  } catch (error) {
    console.error('Sign out error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 