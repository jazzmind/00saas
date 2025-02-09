'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import FullHeightPage from '@/app/components/FullHeightPage';

const OTP_LENGTH = 6;

export default function VerifyPage() {
    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'verifying' | 'verified'>('idle');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const searchParams = useSearchParams();
    const token = searchParams?.get('token');
    const emailParam = searchParams?.get('email');
    const [email, setEmail] = useState(emailParam || '');
    const [isEmailLocked] = useState(!!emailParam);
    const [resendCooldown, setResendCooldown] = useState(0);

    // If we have a token, verify it immediately
    useEffect(() => {
        const verifyToken = async (token: string) => {
            setStatus('verifying');
            try {
                const response = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                    credentials: 'include'
                });

                const data = await response.json();
                
                if (!response.ok) {
                    if (data.error === 'Token expired' && emailParam) {
                        // Request new token
                        setStatus('sending');
                        const resendResponse = await fetch('/api/auth/verify/resend', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: emailParam })
                        });
                        
                        if (resendResponse.ok) {
                            setError('Your verification link expired, but we\'ve sent you a new one. Please check your email.');
                        } else {
                            const resendData = await resendResponse.json();
                            throw new Error(resendData.error || 'Failed to resend verification code');
                        }
                    } else {
                        throw new Error(data.error || 'Invalid verification link');
                    }
                } else {
                    setStatus('verified');

                    // Create session
                    const sessionData = {
                        userId: data.user.id,
                        userAgent: navigator.userAgent,
                        ip: window.location.hostname
                    };
                    console.log('Session data:', sessionData);
                    const sessionResponse = await fetch('/api/auth/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(sessionData),
                        credentials: 'include'
                    });

                    if (!sessionResponse.ok) {
                        throw new Error('Failed to create session');
                    }

                    // Add a small delay to show the verified state
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (data.isNewUser || !data.hasPasskey) {
                        // New user or existing user without passkey, redirect to passkey setup
                        window.location.href = '/passkey';
                    } else if (!data.hasOrganization) {
                        // User has passkey but no organization
                        window.location.href = '/admin/organizations/new';
                    } else {
                        // User is fully set up
                        window.location.href = data.redirectPath || '/dashboard';
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Verification failed');
                setStatus('idle');
            }
        };
        
        if (token) {
            verifyToken(token);
        }
    }, [token, emailParam]);

    // Send initial verification code if we have email but no token
    useEffect(() => {
        const sendInitialCode = async () => {
            if (emailParam && !token && !resendCooldown) {
                setStatus('sending');
                try {
                    const response = await fetch('/api/auth/verify/resend', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailParam })
                    });
                    
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to send verification code');
                    }
                    
                    setError('Verification code sent. Please check your email.');
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to send code');
                } finally {
                    setStatus('idle');
                }
            }
        };

        sendInitialCode();
    }, [emailParam, token, resendCooldown]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all fields are filled and we have an email
    if (email && index === OTP_LENGTH - 1 && value) {
      // Use the updated newOtp array instead of the state
      if (newOtp.every(digit => digit !== '')) {
        setTimeout(() => {
          const form = element.form;
          if (form) {
            form.requestSubmit();
          }
        }, 0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        setError('Email is required');
        return;
    }

    const currentOtp = otp.join('');
    if (currentOtp.length !== OTP_LENGTH) {
        setError('Please enter the complete verification code');
        return;
    }

    setError('');
    setStatus('verifying');

    try {
        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                code: currentOtp
            }),
            credentials: 'include'
        });

        const data = await response.json();
        
        if (!response.ok) {
            if (data.error === 'Code expired') {
                setStatus('sending');
                const resendResponse = await fetch('/api/auth/verify/resend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                if (resendResponse.ok) {
                    setOtp(new Array(OTP_LENGTH).fill(''));
                    inputRefs.current.forEach(input => {
                        if (input) input.value = '';
                    });
                    setError('Your verification code expired, but we\'ve sent you a new one. Please check your email.');
                } else {
                    const resendData = await resendResponse.json();
                    throw new Error(resendData.error || 'Failed to resend verification code');
                }
            } else {
                throw new Error(data.error || 'Invalid verification code');
            }
        } else {
            setStatus('verified');

            // Create session
            const sessionResponse = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.user.id }),
                credentials: 'include'
            });

            if (!sessionResponse.ok) {
                throw new Error('Failed to create session');
            }

            // Add a small delay to show the verified state
            await new Promise(resolve => setTimeout(resolve, 500));
            if (data.isNewUser || !data.hasPasskey) {
                // New user or existing user without passkey, redirect to passkey setup
                window.location.href = '/passkey';
            } else if (!data.hasOrganization) {
                // User has passkey but no organization
                window.location.href = '/admin/organizations/new';
            } else {
                // User is fully set up
                window.location.href = data.redirectPath || '/dashboard';
            }
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
        setStatus('idle');
    }
  };

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, OTP_LENGTH);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, OTP_LENGTH).split('');
    const newOtp = [...otp];
    
    digits.forEach((digit, index) => {
      newOtp[index] = digit;
      if (inputRefs.current[index]) {
        inputRefs.current[index]!.value = digit;
      }
    });

    setOtp(newOtp);
    
    // Wait for state to update before submitting
    if (email && digits.length === OTP_LENGTH) {
      setTimeout(() => {
        // Find the form by traversing up from any input ref
        const form = inputRefs.current[0]?.closest('form');
        if (form) {
          form.requestSubmit();
        }
      }, 0);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    
    setError('');
    setStatus('sending');
    try {
      const response = await fetch('/api/auth/verify/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setOtp(new Array(OTP_LENGTH).fill(''));
        inputRefs.current.forEach(input => {
          if (input) input.value = '';
        });
        setError('New verification code sent. Please check your email.');
        setResendCooldown(30);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <FullHeightPage className="bg-gray-50">
      <div className="max-w-md w-full space-y-8 pb-24">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your verification code
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!isEmailLocked && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-center">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              {isEmailLocked ? `Verification code sent to ${email}` : 'Verification code'}
            </label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(e.target, idx)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-2xl border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || status === 'verified'}
                className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 
                  ? `Resend code in ${resendCooldown}s` 
                  : 'Resend verification code'}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-center text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={status === 'verified'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending...' : 
             status === 'verifying' ? 'Verifying...' :
             status === 'verified' ? 'Verified!' : 'Verify'}
          </button>
        </form>
      </div>
      </FullHeightPage>
  );
}
