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
  const db = getDatabase();
  return db.getUser(id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDatabase();
  return db.getUserByEmail(email);
}

export async function createUser(
  email: string,
  name: string
): Promise<User> {
  const db = getDatabase();
  return db.createUser({
    email,
    name,
    organizations: [],
    emailVerified: false 
  });
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<User> {
  const db = getDatabase();
  return db.updateUser(id, updates);
}

export async function deleteUser(id: string): Promise<void> {
  const db = getDatabase();
  return db.deleteUser(id);
}

export async function searchUsers(query: string): Promise<User[]> {
  const db = getDatabase();
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

 // Re-
export async function createOTP(record: OTP) {
  const db = getDatabase();
  return db.createOTP(record);
}

export async function getOTPByToken(token: string) {
  const db = getDatabase();
  return db.getOTP(token);
}

export async function deleteOTP(token: string) {
  const db = getDatabase();
  return db.deleteOTP(token);
}

export async function deleteExpiredOTPs() {
  const db = getDatabase();
  return db.deleteExpiredOTPs();
} 