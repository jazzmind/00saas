import { NextRequest } from 'next/server';
import { getApiSession } from "@/app/lib/auth/getApiSession";
import { getUserOrganizations, createOrganization, addUserToOrganization } from "@/app/lib/database/organizationDatabase";
import { validateOrganizationName } from "@/app/lib/validate";

/**
 * API Route: Organizations
 * 
 * This endpoint handles fetching organizations for the current user.
 */

export async function GET() {
  try {
    // Verify session and get user info
    const { userId } = getApiSession();

    // Get user's organizations
    const organizations = await getUserOrganizations(userId);

    return new Response(JSON.stringify({
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Organization fetch error:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to fetch organizations' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create a new organization
export async function POST(req: NextRequest) {
  try {
    // Verify session and get user info
    const { userId } = getApiSession();

    // Parse request body
    const body = await req.json();
    const { name } = body;

    // Validate organization name
    const validationError = validateOrganizationName(name);
    if (validationError) {
      return new Response(JSON.stringify({
        error: validationError 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create organization
    const organization = await createOrganization(
      name,
      userId,
      'free'
    );

    // Add user as owner
    await addUserToOrganization(
      organization.id,
      userId,
      userId,
      'owner'
    );

    return new Response(JSON.stringify({
      organization: {
        id: organization.id,
        name: organization.name,
        role: 'owner'
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Organization creation error:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to create organization' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
