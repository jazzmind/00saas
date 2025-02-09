import { Organization, User, OrganizationMembership } from '../types';
import { Firestore } from 'firebase-admin/firestore';
import type { SessionData } from '@/app/lib/types';

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
  getUser(id: string): Promise<(User & { currentOTP?: string | null }) | null>;
  getUserByEmail(email: string): Promise<(User & { currentOTP?: string | null }) | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(id: string, data: Partial<User> & { currentOTP?: string | null }): Promise<User>;
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
  deleteOTP(token: string): Promise<void>;
  deleteExpiredOTPs(): Promise<void>;

  // Session operations
  createSession(session: SessionData): Promise<void>;
  getSession(id: string): Promise<SessionData | null>;
  updateSession(id: string, data: Partial<SessionData>): Promise<void>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;

}

export interface DatabaseConfig {
  type: 'firebase' | 'prisma';
  url?: string; // Database URL for Prisma
  firebaseAdmin?: Firestore; // Firebase admin instance
}

export interface DatabaseError extends Error {
  code: string;
  cause: Error;
}

export interface CollectionReference<T = unknown> {
  doc(id: string): DocumentReference<T>;
  where(field: string, op: string, value: unknown): Query<T>;
}

export interface DocumentReference<T = unknown> {
  get(): Promise<DocumentSnapshot<T>>;
  set(data: T): Promise<void>;
  update(data: Partial<T>): Promise<void>;
  delete(): Promise<void>;
}

export interface DocumentSnapshot<T = unknown> {
  data(): T | undefined;
  ref: DocumentReference<T>;
}

export interface Query<T = unknown> {
  get(): Promise<QuerySnapshot<T>>;
}

export interface QuerySnapshot<T = unknown> {
  forEach(callback: (doc: DocumentSnapshot<T>) => void): void;
}

export interface WriteBatch {
  delete(ref: DocumentReference<unknown>): WriteBatch;
  commit(): Promise<void>;
} 