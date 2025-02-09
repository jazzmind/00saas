/**
 * Core types for the 00SaaS multi-tenant system.
 * These types define the fundamental building blocks of our application.
 */

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  organizations: OrganizationMembership[];
  createdAt: Date;
  updatedAt: Date;
  currentChallenge?: string | null;
  passkeySnoozedUntil?: Date | null;
  authenticators?: Array<{
    credentialID: string;
    credentialPublicKey: string;
    counter: number;
  }>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  members: OrganizationMembership[];
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMembership {
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface OrganizationSettings {
  allowedAuthMethods: ('passkey' | 'google' | 'apple' | 'microsoft' | 'saml')[];
  requireMFA: boolean;
  customDomain?: string;
  brandingSettings?: {
    logo?: string;
    primaryColor?: string;
    accentColor?: string;
  };
}

// Stripe related types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  stripePriceId: string;
}

export interface SessionData {
  id: string;
  userId: string;
  organizationId: string | null;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
  userAgent: string | null;
  ip: string | null;
}

/**
 * @note For AI Agents:
 * This type system is designed to be extensible. When adding new features:
 * 1. Consider the multi-tenant implications
 * 2. Always include createdAt/updatedAt for auditing
 * 3. Use strict types and avoid 'any'
 * 4. Keep interfaces focused and follow single responsibility principle
 */ 