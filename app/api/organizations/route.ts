import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';

/**
 * API Route: Organizations
 * 
 * This endpoint handles fetching organizations for the current user.
 */

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get('session');
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user ID from session
    const db = getDatabase();
    const sessionDoc = await db.getUser(session.value);
    if (!sessionDoc) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const organizations = await db.getUserOrganizations(sessionDoc.id);

    return new Response(JSON.stringify({ organizations }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 