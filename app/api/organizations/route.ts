import { NextRequest } from 'next/server';
import { getServerSession } from "@/lib/auth/getServerSession";
import { db } from "@/lib/database/service";
import { validateOrganizationName } from "@/lib/validate";

/**
 * API Route: Organizations
 * 
 * This endpoint handles fetching organizations for the current user.
 */

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return;

  const organizations = await db.getOrganizations(session.user.id);
  return Response.json({ organizations });
}

// Create a new organization
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) return;

    const { name, organizationName } = await req.json();
    const validationError = validateOrganizationName(organizationName);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const organization = await db.createOrganization(organizationName, session.user.id);

    return Response.json({
      organization: {
        id: organization.id,
        name: organization.name,
        role: 'OWNER'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Organization creation error:', error);
    return Response.json({ 
      error: 'Failed to create organization' 
    }, { status: 500 });
  }
}
