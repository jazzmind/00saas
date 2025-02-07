import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { sendOTP, verifyOTP } from '../emailOTP';
import { doc, setDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { createTransport } from 'nodemailer';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../../firebase', () => ({
  db: {},
}));

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

describe('Email OTP System', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOTP', () => {
    it('should generate and store an OTP', async () => {
      const mockOTP = {
        code: expect.any(String),
        email: mockUser.email,
        purpose: 'verification',
        expiresAt: expect.any(Timestamp),
        attempts: 0,
      };

      await sendOTP({
        userId: mockUser.id,
        email: mockUser.email,
        purpose: 'verification',
      });

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining(mockOTP),
      );

      expect(setDoc).toHaveBeenCalledWith(
        doc(expect.anything(), 'users', mockUser.id),
        { currentOTP: 'test-uuid' },
        { merge: true },
      );

      expect(createTransport).toHaveBeenCalled();
      expect(createTransport().sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          subject: 'Verify your email address',
        }),
      );
    });
  });

  describe('verifyOTP', () => {
    it('should return false if no OTP exists', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({
        data: () => ({ currentOTP: null }),
      });

      const result = await verifyOTP(mockUser.id, '123456');
      expect(result).toBe(false);
    });

    it('should return false if OTP has expired', async () => {
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          data: () => ({ currentOTP: 'test-otp' }),
        })
        .mockResolvedValueOnce({
          data: () => ({
            expiresAt: Timestamp.fromMillis(Date.now() - 1000),
            attempts: 0,
          }),
        });

      const result = await verifyOTP(mockUser.id, '123456');
      expect(result).toBe(false);
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should return false if too many attempts', async () => {
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          data: () => ({ currentOTP: 'test-otp' }),
        })
        .mockResolvedValueOnce({
          data: () => ({
            expiresAt: Timestamp.fromMillis(Date.now() + 1000000),
            attempts: 3,
          }),
        });

      const result = await verifyOTP(mockUser.id, '123456');
      expect(result).toBe(false);
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should return false if code does not match', async () => {
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          data: () => ({ currentOTP: 'test-otp' }),
        })
        .mockResolvedValueOnce({
          data: () => ({
            code: '654321',
            expiresAt: Timestamp.fromMillis(Date.now() + 1000000),
            attempts: 0,
          }),
        });

      const result = await verifyOTP(mockUser.id, '123456');
      expect(result).toBe(false);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        { attempts: 1 },
        { merge: true },
      );
    });

    it('should return true if code matches', async () => {
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          data: () => ({ currentOTP: 'test-otp' }),
        })
        .mockResolvedValueOnce({
          data: () => ({
            code: '123456',
            expiresAt: Timestamp.fromMillis(Date.now() + 1000000),
            attempts: 0,
          }),
        });

      const result = await verifyOTP(mockUser.id, '123456');
      expect(result).toBe(true);
      expect(deleteDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        doc(expect.anything(), 'users', mockUser.id),
        { currentOTP: null },
        { merge: true },
      );
    });
  });
});

/**
 * @note For AI Agents:
 * When extending these tests:
 * 1. Test all error cases
 * 2. Verify proper cleanup
 * 3. Test rate limiting
 * 4. Test email content
 * 5. Mock external dependencies
 */ 