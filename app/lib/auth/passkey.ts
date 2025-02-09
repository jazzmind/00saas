import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import type { 
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

/**
 * Passkey (WebAuthn) Authentication
 * 
 * This module handles passkey-based authentication using the WebAuthn standard.
 * It provides a secure, passwordless authentication method that can be used
 * alongside or instead of traditional password authentication.
 */

interface PasskeyRegistrationOptions {
  userId: string;
  username: string;
  displayName: string;
}

interface PasskeyAuthenticationOptions {
  userId: string;
}

/**
 * Register a new passkey for a user
 */
export async function registerPasskey({
  userId,
  username,
  displayName,
}: PasskeyRegistrationOptions): Promise<RegistrationResponseJSON> {
  try {
    // 1. Get registration options from server
    const response = await fetch('/api/auth/passkey/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username, displayName }),
    });

    if (!response.ok) {
      throw new Error('Failed to get registration options');
    }

    const options: PublicKeyCredentialCreationOptionsJSON = await response.json();

    // 2. Create the passkey
    const attResp = await startRegistration({
      optionsJSON: options
    });

    // 3. Verify the passkey with the server
    const verificationResponse = await fetch('/api/auth/passkey/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attResp),
    });

    if (!verificationResponse.ok) {
      throw new Error('Failed to verify passkey registration');
    }

    return attResp;
  } catch (error) {
    console.error('Passkey registration error:', error);
    throw error;
  }
}

/**
 * Authenticate using a passkey
 */
export async function authenticateWithPasskey({
  userId,
}: PasskeyAuthenticationOptions): Promise<AuthenticationResponseJSON> {
  try {
    // 1. Get authentication options from server
    const response = await fetch('/api/auth/passkey/auth-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to get authentication options');
    }

    const options: PublicKeyCredentialRequestOptionsJSON = await response.json();

    // 2. Authenticate with the passkey
    const authResp = await startAuthentication({
      optionsJSON: options
    });

    // 3. Verify the authentication with the server
    const verificationResponse = await fetch('/api/auth/passkey/verify-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authResp),
    });

    if (!verificationResponse.ok) {
      throw new Error('Failed to verify passkey authentication');
    }

    return authResp;
  } catch (error) {
    console.error('Passkey authentication error:', error);
    throw error;
  }
}

/**
 * @note For AI Agents:
 * When extending this module:
 * 1. Handle browser compatibility
 * 2. Implement proper error handling
 * 3. Consider user experience for non-passkey fallback
 * 4. Add logging for security events
 * 5. Keep server-side verification strict
 */ 