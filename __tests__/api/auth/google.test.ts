import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { GET } from '@/app/api/auth/google/route';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    createSessionCookie: jest.fn(),
  },
}));

describe('Google OAuth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.NEXT_PUBLIC_ORIGIN = 'http://localhost:3000';
  });

  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth URL for initial request', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/google');
      const response = await GET(req);

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain('scope=email+profile');

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
            email: 'test@example.com',
            name: 'Test User',
            picture: 'https://example.com/photo.jpg',
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
        'http://localhost:3000/api/auth/google?code=test-code&state=test-state',
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
            email: 'new@example.com',
            name: 'New User',
            picture: 'https://example.com/photo.jpg',
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
        'http://localhost:3000/api/auth/google?code=test-code&state=test-state',
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
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should handle invalid state', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/auth/google?code=test-code&state=wrong-state',
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
        'http://localhost:3000/api/auth/google?code=test-code&state=test-state',
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