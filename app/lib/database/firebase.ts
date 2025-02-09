import { Firestore, Timestamp, DocumentData } from 'firebase-admin/firestore';
import { DatabaseClient, DatabaseError, OTP } from './types';
import { Organization, User, OrganizationMembership } from '../types';
import type { SessionData } from '@/app/lib/types';

export class FirebaseDatabase implements DatabaseClient {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  private handleError(error: Error & { code?: string }): never {
    const dbError = new Error(error.message) as DatabaseError;
    dbError.code = error.code || 'unknown';
    dbError.cause = error;
    throw dbError;
  }

  private convertTimestampToDate<T extends { createdAt?: Date; updatedAt?: Date; joinedAt?: Date }>(
    data: DocumentData | undefined | null
  ): T {
    if (!data) {
      throw new Error('Document data is null or undefined');
    }
    
    const result = { ...data } as T;
    if (result.createdAt instanceof Timestamp) {
      result.createdAt = result.createdAt.toDate();
    }
    if (result.updatedAt instanceof Timestamp) {
      result.updatedAt = result.updatedAt.toDate();
    }
    if (result.joinedAt instanceof Timestamp) {
      result.joinedAt = result.joinedAt.toDate();
    }
    return result;
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    try {
      const doc = await this.db.collection('users').doc(id).get();
      if (!doc.exists) return null;
      try {
        return this.convertTimestampToDate<User>(doc.data());
      } catch {
        return null;
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await this.db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      // need to add id to the data
      return this.convertTimestampToDate<User>({ id: doc.id, ...doc.data() });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const now = Timestamp.now();
      const data = {
        ...user,
        createdAt: now,
        updatedAt: now,
      };

      const doc = await this.db.collection('users').add(data);
      return this.convertTimestampToDate<User>({ id: doc.id, ...data });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const ref = this.db.collection('users').doc(id);
      const now = Timestamp.now();
      
      await ref.update({
        ...data,
        updatedAt: now,
      });

      const updated = await ref.get();
      return this.convertTimestampToDate<User>(updated.data());
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.db.collection('users').doc(id).delete();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | null> {
    try {
      const doc = await this.db.collection('organizations').doc(id).get();
      if (!doc.exists) return null;
      return this.convertTimestampToDate<Organization>(doc.data());
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      const snapshot = await this.db.collection('organizations')
        .where('slug', '==', slug)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return this.convertTimestampToDate<Organization>(doc.data());
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    try {
      const now = Timestamp.now();
      const data = {
        ...org,
        createdAt: now,
        updatedAt: now,
      };

      const doc = await this.db.collection('organizations').add(data);
      return this.convertTimestampToDate<Organization>({ id: doc.id, ...data });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    try {
      const ref = this.db.collection('organizations').doc(id);
      const now = Timestamp.now();
      
      await ref.update({
        ...data,
        updatedAt: now,
      });

      const updated = await ref.get();
      return this.convertTimestampToDate<Organization>(updated.data());
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      await this.db.collection('organizations').doc(id).delete();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  // Membership operations
  async getMembership(userId: string, organizationId: string): Promise<OrganizationMembership | null> {
    try {
      const snapshot = await this.db.collection('organizationMemberships')
        .where('userId', '==', userId)
        .where('organizationId', '==', organizationId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      return this.convertTimestampToDate<OrganizationMembership>(snapshot.docs[0].data());
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async createMembership(membership: Omit<OrganizationMembership, 'joinedAt'>): Promise<OrganizationMembership> {
    try {
      const data = {
        ...membership,
        joinedAt: Timestamp.now(),
      };

      await this.db.collection('organizationMemberships').add(data);
      return this.convertTimestampToDate<OrganizationMembership>(data);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updateMembership(
    userId: string,
    organizationId: string,
    data: Partial<OrganizationMembership>
  ): Promise<OrganizationMembership> {
    try {
      const snapshot = await this.db.collection('organizationMemberships')
        .where('userId', '==', userId)
        .where('organizationId', '==', organizationId)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        throw new Error('Membership not found');
      }

      const doc = snapshot.docs[0];
      await doc.ref.update(data);

      const updated = await doc.ref.get();
      return this.convertTimestampToDate<OrganizationMembership>(updated.data());
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async deleteMembership(userId: string, organizationId: string): Promise<void> {
    try {
      const snapshot = await this.db.collection('organizationMemberships')
        .where('userId', '==', userId)
        .where('organizationId', '==', organizationId)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.delete();
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  // Query operations
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const memberships = await this.db.collection('organizationMemberships')
        .where('userId', '==', userId)
        .get();

      const orgIds = memberships.docs.map(doc => doc.data().organizationId);
      const organizations: Organization[] = [];

      for (const orgId of orgIds) {
        const org = await this.getOrganization(orgId);
        if (org) organizations.push(org);
      }

      return organizations;
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async getOrganizationMembers(organizationId: string): Promise<User[]> {
    try {
      const memberships = await this.db.collection('organizationMemberships')
        .where('organizationId', '==', organizationId)
        .get();

      const userIds = memberships.docs.map(doc => doc.data().userId);
      const users: User[] = [];

      for (const userId of userIds) {
        const user = await this.getUser(userId);
        if (user) users.push(user);
      }

      return users;
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      // Note: This is a simple implementation. In production, you'd want to use
      // a proper search index like Algolia or Elasticsearch
      const snapshot = await this.db.collection('users')
        .where('email', '>=', query)
        .where('email', '<=', query + '\uf8ff')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => this.convertTimestampToDate<User>(doc.data()));
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async searchOrganizations(query: string): Promise<Organization[]> {
    try {
      // Note: This is a simple implementation. In production, you'd want to use
      // a proper search index like Algolia or Elasticsearch
      const snapshot = await this.db.collection('organizations')
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => this.convertTimestampToDate<Organization>(doc.data()));
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  // OTP operations
  async createOTP(otp: OTP): Promise<OTP> {
    console.log('Creating OTP:', otp);
    const docRef = this.db.collection('otps').doc(otp.token);
    const data = {
      ...otp,
      expiresAt: Timestamp.fromDate(otp.expiresAt),
    };
    await docRef.set(data);
    return otp;
  }

  async getOTP(token: string): Promise<(OTP & { user: User }) | null> {
    const docRef = this.db.collection('otps').doc(token);
    const doc = await docRef.get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;

    const user = await this.getUser(data.userId);
    if (!user) return null;

    return {
      ...data,
      id: doc.id,
      expiresAt: (data.expiresAt as Timestamp).toDate(),
      user
    } as unknown as OTP & { user: User };
  }

  async updateOTP(id: string, data: Partial<OTP>): Promise<OTP> {
    const docRef = this.db.collection('otps').doc(id);
    const updateData = {
      ...data,
      expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : undefined,
    };
    await docRef.update(updateData);
    const updated = await this.getOTP(id);
    if (!updated) throw new Error('OTP not found after update');
    return updated;
  }

  async deleteOTP(id: string): Promise<void> {
    const docRef = this.db.collection('otps').doc(id);
    await docRef.delete();
  }

  async deleteExpiredOTPs(): Promise<void> {
    await this.db.collection('otps')
      .where('expiresAt', '<=', Timestamp.now())
      .get();
  }

  // Session operations
  async createSession(session: SessionData): Promise<void> {
    try {
      const docRef = this.db.collection('sessions').doc(session.id);
      await docRef.set({
        ...session,
        createdAt: Timestamp.fromDate(session.createdAt),
        expiresAt: Timestamp.fromDate(session.expiresAt),
        lastAccessedAt: Timestamp.fromDate(session.lastAccessedAt)
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async getSession(id: string): Promise<SessionData | null> {
    console.log('Getting session:', id);
    try {
      const doc = await this.db.collection('sessions').doc(id).get();
      if (!doc.exists) return null;
      return this.convertTimestampToDate<SessionData>(doc.data());
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async updateSession(id: string, data: Partial<SessionData>): Promise<void> {
    try {
      const docRef = this.db.collection('sessions').doc(id);
      await docRef.update({
        ...data,
        lastAccessedAt: Timestamp.fromDate(data.lastAccessedAt || new Date())
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      await this.db.collection('sessions').doc(id).delete();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    try {
      const snapshot = await this.db.collection('sessions')
        .where('expiresAt', '<=', Timestamp.now())
        .get();
      
      const batch = this.db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      this.handleError(error as Error);
    }
  }
} 


/**
 * @note For AI Agents:
 * This module is for server-side use only.
 * Do not import this in client-side code.
 * Use this for API routes and server components.
 */ 