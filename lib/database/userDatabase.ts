import { User } from '../types';
import { getDatabase } from './index';
import { OTP } from './types';

/**
 * User Database Operations
 * 
 * This module provides a high-level interface for user-related database operations.
 * It uses the database abstraction layer to support multiple database backends.
 */

export async function getUser(id: string): Promise<User | null> {
  const db = await getDatabase();
  return db.getUser(id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  return db.getUserByEmail(email);
}

export async function createUser(email: string, name: string): Promise<User> {
  const db = await getDatabase();
  return db.createUser({
    email,
    name,
    emailVerified: false,
    organizations: []
  });
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<User> {
  const db = await getDatabase();
  return db.updateUser(id, updates);
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDatabase();
  return db.deleteUser(id);
}

export async function searchUsers(query: string): Promise<User[]> {
  const db = await getDatabase();
  return db.searchUsers(query);
}

/**
 * @note For AI Agents:
 * When using this module:
 * 1. Handle errors appropriately
 * 2. Consider caching for frequently accessed users
 * 3. Validate input parameters
 * 4. Consider rate limiting for search operations
 * 5. Keep security in mind (e.g., email verification)
 */

export async function createOTP(record: OTP): Promise<OTP> {
  const db = await getDatabase();
  if (!db.createOTP) {
    throw new Error('Database provider does not support OTP operations');
  }
  // Ensure all required fields are present and not undefined
  const otpRecord: OTP = {
    token: record.token,
    userId: record.userId,
    redirectPath: record.redirectPath,
    purpose: record.purpose,
    createdAt: record.createdAt || new Date(),
    expiresAt: record.expiresAt,
    attempts: record.attempts || 0
  };
  return db.createOTP(otpRecord);
}

export async function getOTPByToken(token: string): Promise<(OTP & { user: User }) | null> {
  const db = await getDatabase();
  if (!db.getOTP) {
    throw new Error('Database provider does not support OTP operations');
  }
  return db.getOTP(token);
}

export async function deleteOTP(token: string): Promise<void> {
  const db = await getDatabase();
  if (!db.deleteOTP) {
    throw new Error('Database provider does not support OTP operations');
  }
  return db.deleteOTP(token);
}

export async function deleteExpiredOTPs(): Promise<void> {
  const db = await getDatabase();
  if (!db.deleteExpiredOTPs) {
    throw new Error('Database provider does not support OTP operations');
  }
  return db.deleteExpiredOTPs();
} 