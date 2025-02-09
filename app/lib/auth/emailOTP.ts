import { randomBytes, createHash } from 'crypto';
import { 
  getUserByEmail, 
  createUser, 
  createOTP, 
  getOTPByToken, 
  deleteOTP,
  deleteExpiredOTPs,
} from '@/app/lib/database/userDatabase';
import { OTP } from '@/app/lib/database/types';
import { sendEmail } from '@/app/lib/email';

/**
 * Email OTP (One-Time Password) System
 * 
 * This module handles the generation, verification, and delivery of OTP codes
 * via email. It's used for:
 * 1. Email verification
 * 2. Sensitive operations (e.g. deleting organizations)
 * 3. Fallback when passkey is not available
 */

interface SendOTPOptions {
  email: string;
  userId: string;
  redirectPath?: string;
  purpose: 'signup' | 'login' | 'verification';
}

/**
 * Generates a 6-digit OTP
 */
function generateOTP(): string {
  return randomBytes(3)
    .readUIntBE(0, 3)
    .toString()
    .padStart(6, '0')
    .slice(-6);
}

/**
 * Creates a token from email and OTP
 */
function generateToken(email: string, otp: string): string {
  if (!email || !otp || !process.env.OTP_SALT) {
    throw new Error('Missing required parameters for token generation');
  }
  const data = `${email.toLowerCase()}:${otp}:${process.env.OTP_SALT}`;
  return createHash('sha256').update(data).digest('base64url');
}

/**
 * Sends an OTP via email and stores it in the database
 */
export async function sendOTP({ email, userId, redirectPath = '/dashboard', purpose }: SendOTPOptions) {
  console.log('Starting sendOTP:', { email, userId, purpose });
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  // Generate OTP
  const otp = generateOTP();
  const token = generateToken(email, otp);
  console.log('Generated OTP and token');
  
  // Get or create user
  let user = await getUserByEmail(email);
  console.log('Found user:', user);
  
  if (!user && purpose === 'signup') {
    user = await createUser(email, 'viewer');
  } else if (!user) {
    throw new Error('User not found');
  }
  
  // Store token record
  const record: OTP = {
    token,
    userId,
    redirectPath,
    purpose,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    attempts: 0
  };
  
  console.log('Storing OTP record');
  await createOTP(record);
  console.log('OTP record stored');

  // Create verification URL
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/magiclink/${token}`;
  console.log('Verification URL:', verifyUrl);
  
  // Send email
  const emailTemplate = purpose === 'signup' ? 'signup-otp' : 'login-otp';
  console.log('Sending email with template:', emailTemplate);
  try {
    await sendEmail({
      to: email,
      template: emailTemplate,
      data: {
        otp,
        verifyUrl,
        expiresIn: '15 minutes'
      }
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }

  return { success: true };
}

/**
 * Verifies a token (from magic link)
 */
export async function verifyToken(token: string) {
  const record = await getOTPByToken(token);
  console.log('Record:', record);
  if (!record) {
    throw new Error('Invalid token');
  }

  if (record.expiresAt < new Date()) {
    throw new Error('Token expired');
  }

  // Delete the OTP record
  await deleteOTP(token);

  return {
    userId: record.userId,
    email: record.user.email,
    purpose: record.purpose,
    redirectPath: record.redirectPath
  };
}

/**
 * Verifies an OTP with email
 */
export async function verifyOTP(email: string, otp: string) {
  const token = generateToken(email, otp);
  console.log('Token:', token); 
  return verifyToken(token);
}

/**
 * Cleanup expired OTPs
 */
export { deleteExpiredOTPs as cleanupExpiredOTPs };

/**
 * @note For AI Agents:
 * When extending this module:
 * 1. Implement rate limiting
 * 2. Add logging for security events
 * 3. Consider implementing backup codes
 * 4. Keep email templates maintainable
 * 5. Handle email delivery failures
 */ 