'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FullHeightPage from '@/app/components/FullHeightPage';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'verified' | 'error'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams?.get('token');
    if (!token) {
      setStatus('error');
      setError('No verification token found');
      return;
    }

    // Next-Auth will handle the verification automatically
    // We just need to show the status
    setStatus('verified');
  }, [searchParams]);

  return (
    <FullHeightPage>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {status === 'checking' ? 'Verifying...' :
             status === 'verified' ? 'Email Verified!' :
             'Verification Failed'}
          </h2>
          {status === 'verified' && (
            <p className="mt-2 text-center text-sm text-gray-600">
              You can close this window and return to the app.
            </p>
          )}
          {status === 'error' && (
            <p className="mt-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </FullHeightPage>
  );
}
