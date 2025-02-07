'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const OTP_LENGTH = 6;

export default function VerifyPage() {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, OTP_LENGTH);
  }, []);

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

    // Submit if all fields are filled
    if (newOtp.every(digit => digit !== '') && !newOtp.includes('')) {
      handleSubmit(newOtp.join(''));
    }
  };

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
    
    const lastFilledIndex = Math.min(digits.length - 1, OTP_LENGTH - 1);
    inputRefs.current[lastFilledIndex]?.focus();

    if (newOtp.every(digit => digit !== '')) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleSubmit = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: searchParams.get('email'), // Get email from URL params
          code 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      const { redirectPath } = await response.json();
      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Enter verification code
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a code to your email
          </p>
        </div>

        <div className="mt-8">
          <div className="flex gap-2 justify-center">
            {otp.map((_, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                ref={(el) => {
                  if (el) inputRefs.current[index] = el;
                }}
                value={otp[index]}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className={`
                  w-12 h-12 text-center text-2xl font-semibold
                  border-2 rounded-xl
                  focus:border-indigo-500 focus:ring-indigo-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  transition-all duration-200
                  ${error ? 'border-red-500' : 'border-gray-300'}
                `}
                disabled={loading}
                maxLength={1}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Verifying...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
