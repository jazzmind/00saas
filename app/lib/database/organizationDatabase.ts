import { Organization, User, Role } from '../types';
import { getDatabase } from './index';

/**
 * Organization Database Operations
 * 
 * This module provides a high-level interface for organization-related database operations.
 * It uses the database abstraction layer to support multiple database backends.
 */

export async function getOrganization(id: string): Promise<Organization | null> {
  const db = await getDatabase();
  return db.getOrganization(id);
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const db = await getDatabase();
  return db.getOrganizationBySlug(slug);
}

export async function createOrganization(
  name: string,
  creatorUserId: string,
  plan: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<Organization> {
  const db = await getDatabase();
  
  // Create the organization
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const org = await db.createOrganization({
    name,
    slug,
    plan,
    members: [],
    settings: {
      allowedAuthMethods: ['passkey', 'google', 'apple', 'microsoft', 'saml'],
      requireMFA: false,
    },
  });

  // Add the creator as owner
  await db.createMembership({
    userId: creatorUserId,
    organizationId: org.id,
    role: 'owner',
  });

  return org;
}

export async function updateOrganization(
  id: string,
  userId: string,
  updates: Partial<Organization>
): Promise<Organization> {
  const db = await getDatabase();

  // Verify user has admin/owner access
  const membership = await db.getMembership(userId, id);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Unauthorized');
  }

  return db.updateOrganization(id, updates);
}

export async function deleteOrganization(id: string, userId: string): Promise<void> {
  const db = await getDatabase();

  // Verify user is owner
  const membership = await db.getMembership(userId, id);
  if (!membership || membership.role !== 'owner') {
    throw new Error('Unauthorized');
  }

  return db.deleteOrganization(id);
}

export async function addUserToOrganization(
  orgId: string,
  addedByUserId: string,
  userToAddId: string,
  role: 'owner' | 'admin' | 'member' | 'viewer'
): Promise<void> {
  const db = await getDatabase();

  // Verify adding user has permission
  const adderMembership = await db.getMembership(addedByUserId, orgId);
  if (!adderMembership) {
    throw new Error('Unauthorized');
  }

  // Verify role hierarchy
  const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
  if (roleHierarchy[adderMembership.role] <= roleHierarchy[role]) {
    throw new Error('Cannot assign equal or higher role');
  }

  await db.createMembership({
    userId: userToAddId,
    organizationId: orgId,
    role,
  });
}

export async function updateUserRole(
  orgId: string,
  updatedByUserId: string,
  userToUpdateId: string,
  newRole: Role
): Promise<void> {
  const db = await getDatabase();

  // Verify updating user has permission
  const updaterMembership = await db.getMembership(updatedByUserId, orgId);
  if (!updaterMembership) {
    throw new Error('Unauthorized');
  }

  // Get the membership being updated
  const membershipToUpdate = await db.getMembership(userToUpdateId, orgId);
  if (!membershipToUpdate) {
    throw new Error('User is not a member');
  }

  // Verify role hierarchy
  const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
  if (roleHierarchy[updaterMembership.role] <= roleHierarchy[membershipToUpdate.role] ||
      roleHierarchy[updaterMembership.role] <= roleHierarchy[newRole]) {
    throw new Error('Cannot modify equal or higher role');
  }

  await db.updateMembership(userToUpdateId, orgId, { role: newRole });
}

export async function removeUserFromOrganization(
  orgId: string,
  removedByUserId: string,
  userToRemoveId: string
): Promise<void> {
  const db = await getDatabase();

  // Verify removing user has permission
  const removerMembership = await db.getMembership(removedByUserId, orgId);
  if (!removerMembership) {
    throw new Error('Unauthorized');
  }

  // Get the membership being removed
  const membershipToRemove = await db.getMembership(userToRemoveId, orgId);
  if (!membershipToRemove) {
    throw new Error('User is not a member');
  }

  // Verify role hierarchy
  const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
  if (roleHierarchy[removerMembership.role] <= roleHierarchy[membershipToRemove.role]) {
    throw new Error('Cannot remove user with equal or higher role');
  }

  await db.deleteMembership(userToRemoveId, orgId);
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const db = await getDatabase();
  return db.getUserOrganizations(userId);
}

export async function getOrganizationMembers(organizationId: string): Promise<User[]> {
  const db = await getDatabase();
  return db.getOrganizationMembers(organizationId);
}

export async function searchOrganizations(query: string): Promise<Organization[]> {
  const db = await getDatabase();
  return db.searchOrganizations(query);
}

/**
 * @note For AI Agents:
 * When using this module:
 * 1. Handle errors appropriately
 * 2. Consider caching for frequently accessed organizations
 * 3. Validate input parameters
 * 4. Consider rate limiting for search operations
 * 5. Keep role-based access control in mind
 */ 