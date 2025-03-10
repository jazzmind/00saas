import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/database';
import { requireSysadmin } from '@/lib/auth/sysadmin';

/**
 * Sysadmin API: Organizations Management
 * 
 * This endpoint allows sysadmins to:
 * - List all organizations
 * - View organization details
 * - Update organization settings
 * - Delete organizations
 */

// GET /api/sysadmin/organizations
export async function GET(req: NextRequest) {
  // Verify sysadmin access
  const authError = await requireSysadmin(req);
  if (authError) return authError;

  try {
    const db = getDatabase();
    const organizations = await db.searchOrganizations('');
    
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

// PUT /api/sysadmin/organizations/[id]
export async function PUT(req: NextRequest) {
  // Verify sysadmin access
  const authError = await requireSysadmin(req);
  if (authError) return authError;

  try {
    const { id, ...updates } = await req.json();
    const db = getDatabase();
    
    // Verify organization exists
    const org = await db.getOrganization(id);
    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update organization
    await db.updateOrganization(id, updates);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE /api/sysadmin/organizations/[id]
export async function DELETE(req: NextRequest) {
  // Verify sysadmin access
  const authError = await requireSysadmin(req);
  if (authError) return authError;

  try {
    const { id } = await req.json();
    const db = getDatabase();
    
    // Verify organization exists
    const org = await db.getOrganization(id);
    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete organization
    await db.deleteOrganization(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
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