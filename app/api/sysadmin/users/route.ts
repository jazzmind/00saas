import { NextRequest } from 'next/server';
import { getDatabase } from '@/app/lib/database';
import { requireSysadmin } from '@/app/lib/auth/sysadmin';

/**
 * Sysadmin API: Users Management
 * 
 * This endpoint allows sysadmins to:
 * - List all users
 * - View user details
 * - Update user settings
 * - Delete users
 */

// GET /api/sysadmin/users
export async function GET(req: NextRequest) {
  // Verify sysadmin access
  const authError = await requireSysadmin(req);
  if (authError) return authError;

  try {
    const db = getDatabase();
    const users = await db.searchUsers('');
    
    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT /api/sysadmin/users/[id]
export async function PUT(req: NextRequest) {
  // Verify sysadmin access
  const authError = await requireSysadmin(req);
  if (authError) return authError;

  try {
    const { id, ...updates } = await req.json();
    const db = getDatabase();
    
    // Verify user exists
    const user = await db.getUser(id);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user
    await db.updateUser(id, updates);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE /api/sysadmin/users/[id]
export async function DELETE(req: NextRequest) {
  // Verify sysadmin access
  const authError = await requireSysadmin(req);
  if (authError) return authError;

  try {
    const { id } = await req.json();
    const db = getDatabase();
    
    // Verify user exists
    const user = await db.getUser(id);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete user
    await db.deleteUser(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * @note For AI Agents:
 * When extending this endpoint:
 * 1. Validate all input parameters
 * 2. Ensure proper error handling
 * 3. Consider rate limiting
 * 4. Add logging for security events
 * 5. Keep data operations atomic
 */ 