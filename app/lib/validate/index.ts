import validator from 'validator';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import xss from 'xss';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Database Content Sanitization
 */

export function sanitizeForDb(input: string): string {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = validator.trim(input);
  
  // Escape special characters
  sanitized = validator.escape(sanitized);
  
  // Remove any null bytes
  sanitized = validator.blacklist(sanitized, '\0');
  
  return sanitized;
}

/**
 * HTML Content Sanitization
 */

export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // First pass with DOMPurify
  let sanitized = purify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  // Second pass with xss
  sanitized = xss(sanitized, {
    whiteList: {
      b: [],
      i: [],
      em: [],
      strong: [],
      a: ['href', 'target', 'rel'],
      p: [],
      br: []
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  });

  return sanitized;
}

/**
 * Validation Rules
 */

export function validateOrganizationName(name: string): string | null {
  if (!name) return 'Organization name is required';
  
  const sanitized = sanitizeForDb(name);
  
  if (sanitized.length < 2) {
    return 'Organization name must be at least 2 characters';
  }
  
  if (sanitized.length > 50) {
    return 'Organization name must be less than 50 characters';
  }
  
  if (!validator.isAlphanumeric(sanitized, 'en-US', { ignore: ' -_.' })) {
    return 'Organization name can only contain letters, numbers, spaces, and basic punctuation';
  }
  
  return null;
}

export function validateEmail(email: string): ValidationResult {
  const sanitized = validator.normalizeEmail(email) || '';
  
  return {
    isValid: validator.isEmail(sanitized),
    sanitized,
    error: !validator.isEmail(sanitized) ? 'Invalid email address' : undefined
  };
}

export function validateUsername(username: string): ValidationResult {
  const sanitized = sanitizeForDb(username);
  
  return {
    isValid: validator.isLength(sanitized, { min: 3, max: 30 }) && 
             validator.isAlphanumeric(sanitized, 'en-US', { ignore: '-_' }),
    sanitized,
    error: !validator.isLength(sanitized, { min: 3, max: 30 }) 
           ? 'Username must be between 3 and 30 characters'
           : !validator.isAlphanumeric(sanitized, 'en-US', { ignore: '-_' })
           ? 'Username can only contain letters, numbers, hyphens, and underscores'
           : undefined
  };
}

export function validatePassword(password: string): ValidationResult {
  return {
    isValid: validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }),
    sanitized: password,
    error: !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }) ? 'Password must be at least 8 characters and contain uppercase, lowercase, number, and symbol' : undefined
  };
}

/**
 * Content Validation
 */

export function validateContent(content: string, maxLength = 5000): ValidationResult {
  const sanitized = sanitizeHtml(content);
  
  return {
    isValid: sanitized.length > 0 && sanitized.length <= maxLength,
    sanitized,
    error: sanitized.length === 0 
           ? 'Content cannot be empty'
           : sanitized.length > maxLength 
           ? `Content must be less than ${maxLength} characters`
           : undefined
  };
} 