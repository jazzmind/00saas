import { Organization, User, OrganizationMembership } from '../types';
import type { SessionData } from '@/lib/types';

export interface OTP {
  token: string;
  userId: string;
  redirectPath: string;
  purpose: 'signup' | 'login' | 'verification';
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
}

export interface DatabaseClient {
  // User operations
  getUser(id: string): Promise<(User & { VerifyToken?: string | null }) | null>;
  getUserByEmail(email: string): Promise<(User & { VerifyToken?: string | null }) | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(id: string, data: Partial<User> & { VerifyToken?: string | null }): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Organization operations
  getOrganization(id: string): Promise<Organization | null>;
  getOrganizationBySlug(slug: string): Promise<Organization | null>;
  createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>;
  updateOrganization(id: string, data: Partial<Organization>): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;

  // Membership operations
  getMembership(userId: string, organizationId: string): Promise<OrganizationMembership | null>;
  createMembership(membership: Omit<OrganizationMembership, 'joinedAt'>): Promise<OrganizationMembership>;
  updateMembership(userId: string, organizationId: string, data: Partial<OrganizationMembership>): Promise<OrganizationMembership>;
  deleteMembership(userId: string, organizationId: string): Promise<void>;
  
  // Query operations
  getUserOrganizations(userId: string): Promise<Organization[]>;
  getOrganizationMembers(organizationId: string): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  searchOrganizations(query: string): Promise<Organization[]>;

  // OTP operations
  createOTP(record: OTP): Promise<OTP>;
  getOTP(token: string): Promise<(OTP & { user: User }) | null>;
  deleteOTP(id: string): Promise<void>;
  deleteExpiredOTPs(): Promise<void>;

  // Session operations
  createSession(session: SessionData): Promise<void>;
  getSession(id: string): Promise<SessionData | null>;
  updateSession(id: string, data: Partial<SessionData>): Promise<void>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;

}

export interface DatabaseConfig {
  type: 'prisma';
  url?: string; // Database URL for Prisma
}

export interface DatabaseError extends Error {
  code: string;
  cause: Error;
} 