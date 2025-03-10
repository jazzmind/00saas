/**
 * Authentication Providers
 * 
 * This module provides client-side authentication methods that communicate
 * with server-side API routes for actual Firebase operations.
 */

export interface AuthResult {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  isNewUser: boolean;
}

/**
 * Email Authentication
 */
export const emailAuth = {
  signUp: async (email: string, password: string): Promise<AuthResult> => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sign up');
    }

    return response.json();
  },

  signIn: async (email: string, password: string): Promise<AuthResult> => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sign in');
    }

    return response.json();
  },

  resetPassword: async (email: string): Promise<void> => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }
  },
};

/**
 * OAuth Providers
 */
export const oauthProviders = {
  google: async (): Promise<AuthResult> => {
    window.location.href = '/api/auth/google';
    return new Promise(() => {}); // This will never resolve as we're redirecting
  },

  apple: async (): Promise<AuthResult> => {
    window.location.href = '/api/auth/apple';
    return new Promise(() => {});
  },

  microsoft: async (): Promise<AuthResult> => {
    window.location.href = '/api/auth/microsoft';
    return new Promise(() => {});
  },

  saml: async (domain: string): Promise<AuthResult> => {
    window.location.href = `/api/auth/saml?domain=${encodeURIComponent(domain)}`;
    return new Promise(() => {});
  },
};

/**
 * @note For AI Agents:
 * When extending this module:
 * 1. Keep all Firebase operations in API routes
 * 2. Handle network errors appropriately
 * 3. Maintain proper type safety
 * 4. Consider rate limiting
 * 5. Keep error messages user-friendly
 */ 