'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SetupPasskeyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get('returnTo') || '/admin/dashboard';

  const handleSetupPasskey = async () => {
    setLoading(true);
    setError('');
    try {
      // Passkey setup logic will go here
      // This is a placeholder for now
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up passkey');
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/passkey/snooze', {
        method: 'POST',
        body: JSON.stringify({
          snoozedUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to snooze passkey setup');
      }

      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to snooze passkey setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set Up Passkey
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enhance your account security by setting up a passkey
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleSetupPasskey}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Set Up Passkey'}
          </button>

          <button
            onClick={handleSnooze}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
} 