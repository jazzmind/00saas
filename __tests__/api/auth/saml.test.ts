import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { GET } from '@/app/api/auth/saml/route';
import * as passportSaml from 'passport-saml';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    createSessionCookie: jest.fn(),
  },
}));

// Mock SAML Strategy
jest.mock('passport-saml', () => {
  const mockStrategy = jest.fn().mockImplementation(() => ({
    generateAuthorizeRequest: jest.fn((options, callback) => {
      callback(null, 'https://idp.example.com/saml/sso?request=test');
    }),
    validateResponse: jest.fn((options, response, callback) => {
      callback(null, {
        email: 'test@example.com',
        displayName: 'Test User',
      });
    }),
  }));
  return { Strategy: mockStrategy };
});

describe('SAML API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_ORIGIN = 'http://localhost:3000';
    process.env.SAML_ISSUER = 'test-issuer';
    process.env.SAML_CERT = 'test-cert';
    process.env.SAML_PRIVATE_KEY = 'test-private-key';
  });

  describe('GET /api/auth/saml', () => {
    it('should require domain parameter for initial request', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/saml');
      const response = await GET(req);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Domain is required');
    });

    it('should redirect to IdP for initial request', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/saml?domain=example.com');
      const response = await GET(req);

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toBe('https://idp.example.com/saml/sso?request=test');

      const cookies = response.headers.get('Set-Cookie');
      expect(cookies).toContain('saml_request_id=');
      expect(cookies).toContain('saml_domain=example.com');
      expect(cookies).toContain('HttpOnly');
      expect(cookies).toContain('SameSite=Lax');
    });

    it('should handle callback with valid SAMLResponse', async () => {
      // Mock existing user
      (adminAuth.getUserByEmail as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
      });

      // Mock session creation
      (adminAuth.createSessionCookie as jest.Mock).mockResolvedValue('test-session');

      const req = new NextRequest(
        'http://localhost:3000/api/auth/saml?SAMLResponse=test-response',
        {
          headers: {
            cookie: 'saml_request_id=test-request-id; saml_domain=example.com',
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
      // Mock user not found
      (adminAuth.getUserByEmail as jest.Mock).mockRejectedValueOnce(new Error('user-not-found'));
      
      // Mock user creation
      (adminAuth.createUser as jest.Mock).mockResolvedValueOnce({
        uid: 'new-uid',
        email: 'test@example.com',
      });

      // Mock session creation
      (adminAuth.createSessionCookie as jest.Mock).mockResolvedValue('test-session');

      const req = new NextRequest(
        'http://localhost:3000/api/auth/saml?SAMLResponse=test-response',
        {
          headers: {
            cookie: 'saml_request_id=test-request-id; saml_domain=example.com',
          },
        }
      );

      const response = await GET(req);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/home');
      expect(adminAuth.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
      });
    });

    it('should handle missing SAML state', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/auth/saml?SAMLResponse=test-response'
      );

      const response = await GET(req);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/login?error=');
    });

    it('should handle SAML validation failure', async () => {
      // Mock SAML validation error
      const mockStrategy = jest.fn().mockImplementation(() => ({
        validateResponse: jest.fn((options, response, callback) => {
          callback(new Error('SAML validation failed'));
        }),
      }));
      jest.spyOn(passportSaml, 'Strategy').mockImplementation(mockStrategy);

      const req = new NextRequest(
        'http://localhost:3000/api/auth/saml?SAMLResponse=test-response',
        {
          headers: {
            cookie: 'saml_request_id=test-request-id; saml_domain=example.com',
          },
        }
      );

      const response = await GET(req);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/login?error=');
    });

    it('should handle missing email in SAML response', async () => {
      // Mock SAML response without email
      const mockStrategy = jest.fn().mockImplementation(() => ({
        validateResponse: jest.fn((options, response, callback) => {
          callback(null, {
            displayName: 'Test User',
          });
        }),
      }));
      jest.spyOn(passportSaml, 'Strategy').mockImplementation(mockStrategy);

      const req = new NextRequest(
        'http://localhost:3000/api/auth/saml?SAMLResponse=test-response',
        {
          headers: {
            cookie: 'saml_request_id=test-request-id; saml_domain=example.com',
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