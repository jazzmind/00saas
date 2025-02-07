import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../verify-email/route';
import { verifyOTP } from '@/app/lib/auth/emailOTP';
import { getDoc, updateDoc, DocumentSnapshot, DocumentData, DocumentReference } from 'firebase/firestore';
import { NextRequest } from 'next/server';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('@/app/lib/firebase', () => ({
  db: {},
}));

// Mock emailOTP
jest.mock('@/app/lib/auth/emailOTP', () => ({
  verifyOTP: jest.fn(),
}));

describe('Email Verification Endpoint', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
  };

  interface RequestBody {
    userId?: string;
    code?: string;
  }

  const createMockRequest = (body: RequestBody) => {
    return new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const createMockRef = (): DocumentReference => ({
    id: 'mock-id',
    path: 'mock/path',
    parent: {} as any,
    type: 'document',
    firestore: {} as any,
    withConverter: () => ({} as any),
  });

  const createMockDocumentSnapshot = (exists: boolean, data?: DocumentData): Partial<DocumentSnapshot> => ({
    exists: () => exists,
    data: () => data,
    id: 'mock-id',
    ref: createMockRef(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (verifyOTP as jest.Mock).mockReset();
    (getDoc as jest.Mock).mockReset();
    (updateDoc as jest.Mock).mockReset();
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await POST(createMockRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 if OTP is invalid', async () => {
    jest.mocked(verifyOTP).mockResolvedValueOnce(false);

    const response = await POST(createMockRequest({
      userId: mockUser.id,
      code: '123456',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid or expired code');
  });

  it('should return 404 if user is not found', async () => {
    jest.mocked(verifyOTP).mockResolvedValueOnce(true);
    jest.mocked(getDoc).mockResolvedValueOnce(createMockDocumentSnapshot(false) as DocumentSnapshot);

    const response = await POST(createMockRequest({
      userId: mockUser.id,
      code: '123456',
    }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should verify email and update user document', async () => {
    jest.mocked(verifyOTP).mockResolvedValueOnce(true);
    jest.mocked(getDoc).mockResolvedValueOnce(
      createMockDocumentSnapshot(true, { email: mockUser.email }) as DocumentSnapshot
    );

    const response = await POST(createMockRequest({
      userId: mockUser.id,
      code: '123456',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        emailVerified: true,
        updatedAt: expect.any(Date),
      },
    );
  });

  it('should handle internal errors', async () => {
    jest.mocked(verifyOTP).mockRejectedValueOnce(new Error('Test error'));

    const response = await POST(createMockRequest({
      userId: mockUser.id,
      code: '123456',
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

/**
 * @note For AI Agents:
 * When extending these tests:
 * 1. Test all error cases
 * 2. Verify proper state updates
 * 3. Test rate limiting
 * 4. Test security measures
 * 5. Mock external dependencies
 */ 