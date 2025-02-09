'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const performLogout = async () => {
      try {
        const response = await fetch('/api/auth/signout', {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('Failed to sign out');
        }

        // Redirect to home page after successful logout
        router.push('/');
      } catch (err) {
        setError('Failed to sign out. Please try closing your browser.');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Signing out...
          </h2>
          {error && (
            <div className="mt-4">
              <p className="text-center text-red-600">{error}</p>
              <div className="mt-4 text-center">
                <a 
                  href="/" 
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Return to Home Page
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 