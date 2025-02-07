import { NextRequest } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';
import { GET } from '@/app/api/auth/microsoft/route';

// Mock Firebase Admin
jest.mock('@/app/lib/firebase-admin', () => ({
  adminAuth: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    createSessionCookie: jest.fn(),
  },
}));

describe('Microsoft OAuth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MICROSOFT_CLIENT_ID = 'test-client-id';
    process.env.MICROSOFT_CLIENT_SECRET = 'test-client-secret';
    process.env.NEXT_PUBLIC_ORIGIN = 'http://localhost:3000';
  });

  describe('GET /api/auth/microsoft', () => {
    it('should redirect to Microsoft OAuth URL for initial request', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/microsoft');
      const response = await GET(req);

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toContain('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain('scope=openid+email+profile+User.Read');

      const cookies = response.headers.get('Set-Cookie');
      expect(cookies).toContain('oauth_state=');
      expect(cookies).toContain('HttpOnly');
      expect(cookies).toContain('SameSite=Lax');
    });

    it('should handle callback with valid state and code', async () => {
      // Mock successful token exchange
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token' }),
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            mail: 'test@example.com',
            displayName: 'Test User',
          }),
        }));

      // Mock existing user
      (adminAuth.getUserByEmail as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      // Mock session creation
      (adminAuth.createSessionCookie as jest.Mock).mockResolvedValue('test-session');

      const req = new NextRequest(
        'http://localhost:3000/api/auth/microsoft?code=test-code&state=test-state',
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
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token' }),
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            mail: 'new@example.com',
            displayName: 'New User',
          }),
        }));

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
        'http://localhost:3000/api/auth/microsoft?code=test-code&state=test-state',
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
        displayName: 'New User',
        photoURL: null,
      });
    });

    it('should handle invalid state', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/auth/microsoft?code=test-code&state=wrong-state',
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
        'http://localhost:3000/api/auth/microsoft?code=test-code&state=test-state',
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

    it('should handle user info fetch failure', async () => {
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token' }),
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
        }));

      const req = new NextRequest(
        'http://localhost:3000/api/auth/microsoft?code=test-code&state=test-state',
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