import { PrismaClient } from '@prisma/client';
import { DatabaseClient, DatabaseError, OTP } from './types';
import { Organization, User, OrganizationMembership } from '../types';
import type { SessionData } from '@/app/lib/types';

export class PrismaDatabase implements DatabaseClient {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private handleError(error: unknown): never {
    const dbError = new Error(error instanceof Error ? error.message : 'Unknown error') as DatabaseError;
    dbError.code = error instanceof Error && 'code' in error ? (error as { code?: string }).code || 'unknown' : 'unknown';
    dbError.cause = error instanceof Error ? error : new Error('Unknown error');
    throw dbError;
  }

  // User operations
  async getUser(id: string): Promise<(User & { currentOTP?: string | null }) | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          organizations: true,
          currentOTP: true,
        },
      });
      if (!user) return null;
      return {
        ...user,
        currentOTP: user.currentOTP?.id || null,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserByEmail(email: string): Promise<(User & { currentOTP?: string | null }) | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          organizations: true,
          currentOTP: true,
        },
      });
      if (!user) return null;
      return {
        ...user,
        currentOTP: user.currentOTP?.id || null,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const created = await this.prisma.user.create({
        data: {
          ...user,
          organizations: { create: [] },
        },
        include: { organizations: true },
      });
      return created as User;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateUser(id: string, data: Partial<User> & { currentOTP?: string | null }): Promise<User> {
    try {
      const { currentOTP, ...userData } = data;
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          ...userData,
          currentOTP: currentOTP ? {
            connect: { id: currentOTP }
          } : undefined,
        },
        include: {
          organizations: true,
        },
      });
      return updated;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | null> {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { id },
        include: { members: true },
      });
      return org as Organization | null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { slug },
        include: { members: true },
      });
      return org as Organization | null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    try {
      const created = await this.prisma.organization.create({
        data: {
          ...org,
          members: { create: [] },
        },
        include: { members: true },
      });
      return created as Organization;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    try {
      const updated = await this.prisma.organization.update({
        where: { id },
        data,
        include: { members: true },
      });
      return updated as Organization;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      await this.prisma.organization.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Membership operations
  async getMembership(userId: string, organizationId: string): Promise<OrganizationMembership | null> {
    try {
      const membership = await this.prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });
      return membership as OrganizationMembership | null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createMembership(membership: Omit<OrganizationMembership, 'joinedAt'>): Promise<OrganizationMembership> {
    try {
      const created = await this.prisma.organizationMembership.create({
        data: membership,
      });
      return created as OrganizationMembership;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateMembership(
    userId: string,
    organizationId: string,
    data: Partial<OrganizationMembership>
  ): Promise<OrganizationMembership> {
    try {
      const updated = await this.prisma.organizationMembership.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data,
      });
      return updated as OrganizationMembership;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteMembership(userId: string, organizationId: string): Promise<void> {
    try {
      await this.prisma.organizationMembership.delete({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Query operations
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const memberships = await this.prisma.organizationMembership.findMany({
        where: { userId },
        include: { organization: { include: { members: true } } },
      });
      return memberships.map((m: { organization: Organization }) => m.organization) as Organization[];
    } catch (error) {
      this.handleError(error);
    }
  }

  async getOrganizationMembers(organizationId: string): Promise<User[]> {
    try {
      const memberships = await this.prisma.organizationMembership.findMany({
        where: { organizationId },
        include: { user: { include: { organizations: true } } },
      });
      return memberships.map((m: { user: User }) => m.user) as User[];
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query } },
            { name: { contains: query } },
          ],
        },
        include: { organizations: true },
        take: 10,
      });
      return users as User[];
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchOrganizations(query: string): Promise<Organization[]> {
    try {
      const organizations = await this.prisma.organization.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { slug: { contains: query } },
          ],
        },
        include: { members: true },
        take: 10,
      });
      return organizations as Organization[];
    } catch (error) {
      this.handleError(error);
    }
  }

  // OTP operations
  async createOTP(otp: OTP): Promise<OTP> {
    try {
      const created = await this.prisma.otp.create({
        data: {
          token: otp.token,
          redirectPath: otp.redirectPath,
          userId: otp.userId,
          purpose: otp.purpose,
          expiresAt: otp.expiresAt,
          attempts: otp.attempts,
        },
      });
      return created as OTP;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getOTP(token: string): Promise<(OTP & { user: User }) | null> {
    try {
      const otp = await this.prisma.otp.findUnique({
        where: { token },
        include: { user: { include: { organizations: true } } }
      });
      return otp as (OTP & { user: User }) | null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateOTP(id: string, data: Partial<OTP>): Promise<OTP> {
    try {
      const updated = await this.prisma.otp.update({
        where: { id },
        data,
      });
      return updated as OTP;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteOTP(id: string): Promise<void> {
    try {
      await this.prisma.otp.delete({
        where: { id },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteExpiredOTPs(): Promise<void> {
    try {
      await this.prisma.otp.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
    } catch (error) {
      this.handleError(error);
    }
  }


  // Session operations
  async createSession(session: SessionData): Promise<void> {
    try {
      await this.prisma.session.create({
        data: session
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSession(id: string): Promise<SessionData | null> {
    try {
      return await this.prisma.session.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateSession(id: string, data: Partial<SessionData>): Promise<void> {
    try {
      await this.prisma.session.update({
        where: { id },
        data
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      await this.prisma.session.delete({
        where: { id }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    try {
      await this.prisma.session.deleteMany({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }
} 