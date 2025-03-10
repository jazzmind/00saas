import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { GET } from '@/app/api/auth/apple/route';
import * as jose from 'jose';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    createSessionCookie: jest.fn(),
  },
}));

// Mock jose
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('test-client-secret'),
  })),
  importPKCS8: jest.fn().mockResolvedValue('test-key'),
  decodeJwt: jest.fn(),
}));

describe('Apple OAuth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APPLE_CLIENT_ID = 'test-client-id';
    process.env.APPLE_TEAM_ID = 'test-team-id';
    process.env.APPLE_KEY_ID = 'test-key-id';
    process.env.APPLE_PRIVATE_KEY = 'test-private-key';
    process.env.NEXT_PUBLIC_ORIGIN = 'http://localhost:3000';
  });

  describe('GET /api/auth/apple', () => {
    it('should redirect to Apple OAuth URL for initial request', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/apple');
      const response = await GET(req);

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toContain('https://appleid.apple.com/auth/authorize');
      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain('scope=email+name');

      const cookies = response.headers.get('Set-Cookie');
      expect(cookies).toContain('oauth_state=');
      expect(cookies).toContain('HttpOnly');
      expect(cookies).toContain('SameSite=Lax');
    });

    it('should handle callback with valid state and code', async () => {
      // Mock successful token exchange
      global.fetch = jest.fn().mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id_token: 'test-id-token' }),
      }));

      // Mock JWT decode
      (jose.decodeJwt as jest.Mock).mockReturnValue({
        email: 'test@example.com',
      });

      // Mock existing user
      (adminAuth.getUserByEmail as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      // Mock session creation
      (adminAuth.createSessionCookie as jest.Mock).mockResolvedValue('test-session');

      const req = new NextRequest(
        'http://localhost:3000/api/auth/apple?code=test-code&state=test-state',
        {
          headers: {
            cookie: 'oauth_state=test-state',
          },
        }
      );

      const response = await GET(req);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/home');
      expect(response.headers.get('Set-Cookie')).toContain('session=test-session');
      expect(adminAuth.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(adminAuth.createSessionCookie).toHaveBeenCalled();
    });

    it('should create new user if not exists', async () => {
      // Mock successful token exchange
      global.fetch = jest.fn().mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id_token: 'test-id-token' }),
      }));

      // Mock JWT decode
      (jose.decodeJwt as jest.Mock).mockReturnValue({
        email: 'new@example.com',
      });

      // Mock user not found
      (adminAuth.getUserByEmail as jest.Mock).mockRejectedValueOnce(new Error('user-not-found'));
      
      // Mock user creation
      (adminAuth.createUser as jest.Mock).mockResolvedValueOnce({
        uid: 'new-uid',
        email: 'new@example.com',
      });

      // Mock session creation
      (adminAuth.createSessionCookie as jest.Mock).mockResolvedValue('test-session');

      const req = new NextRequest(
        'http://localhost:3000/api/auth/apple?code=test-code&state=test-state&user=' + 
        encodeURIComponent(JSON.stringify({ name: { firstName: 'New' } })),
        {
          headers: {
            cookie: 'oauth_state=test-state',
          },
        }
      );

      const response = await GET(req);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/home');
      expect(adminAuth.createUser).toHaveBeenCalledWith({
        email: 'new@example.com',
        emailVerified: true,
        displayName: 'New',
      });
    });

    it('should handle invalid state', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/auth/apple?code=test-code&state=wrong-state',
        {
          headers: {
            cookie: 'oauth_state=test-state',
          },
        }
      );

      const response = await GET(req);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/login?error=');
    });

    it('should handle token exchange failure', async () => {
      global.fetch = jest.fn().mockImplementationOnce(() => Promise.resolve({
        ok: false,
      }));

      const req = new NextRequest(
        'http://localhost:3000/api/auth/apple?code=test-code&state=test-state',
        {
          headers: {
            cookie: 'oauth_state=test-state',
          },
        }
      );

      const response = await GET(req);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/login?error=');
    });

    it('should handle missing email in ID token', async () => {
      // Mock successful token exchange
      global.fetch = jest.fn().mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id_token: 'test-id-token' }),
      }));

      // Mock JWT decode with no email
      (jose.decodeJwt as jest.Mock).mockReturnValue({});

      const req = new NextRequest(
        'http://localhost:3000/api/auth/apple?code=test-code&state=test-state',
        {
          headers: {
            cookie: 'oauth_state=test-state',
          },
        }
      );

      const response = await GET(req);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/login?error=');
    });
  });
});

afterAll(() => {
  jest.resetAllMocks();
}); 