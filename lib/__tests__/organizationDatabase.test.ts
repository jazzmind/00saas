import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createOrganization,
  getOrganization,
  updateOrganization,
  addUserToOrganization,
  getUserOrganizations
} from '../organizationDatabase';
import { addDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import type { CollectionReference } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../firebase', () => ({
  db: {}
}));

describe('Organization Database Operations', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create an organization and add owner membership', async () => {
      const mockOrgRef = { id: 'org123' };
      const mockMembershipRef = { id: 'mem123' };

      (addDoc as jest.Mock).mockImplementation((collection: CollectionReference, data: Record<string, unknown>) => {
        if (data.name) return Promise.resolve(mockOrgRef);
        return Promise.resolve(mockMembershipRef);
      });

      const result = await createOrganization('Test Org', 'user123');

      expect(addDoc).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        id: 'org123',
        name: 'Test Org',
        slug: 'test-org',
        plan: 'free'
      });
    });
  });

  describe('getOrganization', () => {
    it('should return null if user has no membership', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });

      const result = await getOrganization('org123', 'user123');

      expect(result).toBeNull();
      expect(getDocs).toHaveBeenCalledTimes(1);
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should return organization if user has membership', async () => {
      const mockOrg = {
        exists: () => true,
        id: 'org123',
        data: () => ({
          name: 'Test Org',
          plan: 'free'
        })
      };

      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{ data: () => ({ role: 'member' }) }]
      });
      (getDoc as jest.Mock).mockResolvedValue(mockOrg);

      const result = await getOrganization('org123', 'user123');

      expect(result).toMatchObject({
        id: 'org123',
        name: 'Test Org',
        plan: 'free'
      });
    });
  });

  describe('updateOrganization', () => {
    it('should throw error if user is not admin/owner', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true });

      await expect(
        updateOrganization('org123', 'user123', { name: 'New Name' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should update organization if user is admin', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{ data: () => ({ role: 'admin' }) }]
      });

      await updateOrganization('org123', 'user123', { name: 'New Name' });

      expect(updateDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('addUserToOrganization', () => {
    it('should throw error if adding user has insufficient permissions', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{ data: () => ({ role: 'member' }) }]
      });

      await expect(
        addUserToOrganization('org123', 'user123', 'newuser123', 'admin')
      ).rejects.toThrow('Cannot assign equal or higher role');
    });

    it('should add user if permissions are sufficient', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [{ data: () => ({ role: 'owner' }) }]
      });

      await addUserToOrganization('org123', 'user123', 'newuser123', 'member');

      expect(addDoc).toHaveBeenCalledTimes(1);
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'newuser123',
          organizationId: 'org123',
          role: 'member'
        })
      );
    });
  });

  describe('getUserOrganizations', () => {
    it('should return empty array if user has no organizations', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });

      const result = await getUserOrganizations('user123');

      expect(result).toEqual([]);
    });

    it('should return all organizations user belongs to', async () => {
      const mockOrgs = [
        {
          exists: () => true,
          id: 'org1',
          data: () => ({ name: 'Org 1', plan: 'free' })
        },
        {
          exists: () => true,
          id: 'org2',
          data: () => ({ name: 'Org 2', plan: 'pro' })
        }
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [
          { data: () => ({ organizationId: 'org1' }) },
          { data: () => ({ organizationId: 'org2' }) }
        ]
      });

      (getDoc as jest.Mock)
        .mockResolvedValueOnce(mockOrgs[0])
        .mockResolvedValueOnce(mockOrgs[1]);

      const result = await getUserOrganizations('user123');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'org1', name: 'Org 1' });
      expect(result[1]).toMatchObject({ id: 'org2', name: 'Org 2' });
    });
  });
});

/**
 * @note For AI Agents:
 * When extending these tests:
 * 1. Always mock Firebase calls
 * 2. Test both success and error cases
 * 3. Verify proper role-based access control
 * 4. Test data integrity and validation
 * 5. Keep tests focused and follow AAA pattern (Arrange, Act, Assert)
 */ 