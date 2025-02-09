"use client";
// pages/login.tsx
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { oauthProviders } from '@/app/lib/auth/authProviders';
import FullHeightPage from '@/app/components/FullHeightPage';
import { startAuthentication } from '@simplewebauthn/browser';

/**
 * Login Page
 * 
 * This page handles user login with email/password.
 * If ALLOW_SIGNUP is true, it also shows a link to the signup page.
 */

interface LoginState {
  email: string;
  error: string | null;
  isLoading: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get('returnTo') || '/dashboard';
  const [state, setState] = useState<LoginState>({
    email: '',
    error: null,
    isLoading: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First check if user exists and has passkey
      const checkResponse = await fetch('/api/auth/passkey/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email })
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error(checkData.error || 'Failed to check authentication method');
      }

      if (checkData.hasPasskey) {
        // User has passkey, start WebAuthn authentication
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const optionsResponse = await fetch('/api/auth/passkey/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: state.email })
        });

        const options = await optionsResponse.json();
        
        if (!optionsResponse.ok) {
          throw new Error(options.error || 'Failed to get authentication options');
        }

        const authResponse = await startAuthentication(options);
        
        const verifyResponse = await fetch('/api/auth/passkey/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: state.email,
            response: authResponse 
          })
        });

        if (!verifyResponse.ok) {
          const data = await verifyResponse.json();
          throw new Error(data.error || 'Passkey verification failed');
        }

        // Passkey verified, redirect to appropriate page
        router.push(returnTo);

      } else {
        // No passkey, send to OTP verification
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: state.email })
        });

        if (!verifyResponse.ok) {
          const data = await verifyResponse.json();
          throw new Error(data.error || 'Failed to send verification code');
        }

        // Redirect to verify page
        router.push(`/verify?email=${encodeURIComponent(state.email)}`);
      }

    } catch (err) {
      console.error('Login error:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Authentication failed',
        isLoading: false,
      }));
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'microsoft') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await oauthProviders[provider]();
    } catch (error) {
      console.error('Social login error:', error);
      setState(prev => ({
        ...prev,
        error: `Failed to login with ${provider}`,
        isLoading: false,
      }));
    }
  };

  return (
    <FullHeightPage className="bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to continue to {process.env.NEXT_PUBLIC_COMPANY_NAME || 'your account'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100/10 rounded-xl sm:px-10 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={state.email}
                    onChange={e => setState(prev => ({ ...prev, email: e.target.value }))}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {state.error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={state.isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {state.isLoading ? 'Sending link...' : 'Continue with Email'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => handleSocialLogin('apple')}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M17.05,11.97 C17.0368631,10.2609957 18.4014975,9.12518481 20.15,9 C19.4261722,7.87561613 18.1923009,7.19091694 16.85,7.13 C15.3951412,6.97293145 13.9821544,8.03377957 13.25,8.03377957 C12.4894686,8.03377957 11.2231161,7.16336651 10.05,7.2 C8.35869069,7.27099492 6.81104823,8.18849702 5.95,9.62 C4.12094437,12.6046934 5.47069493,17.0386721 7.25,19.47 C8.12820929,20.6595755 9.15539301,21.9931034 10.45,21.93 C11.7041188,21.8567585 12.1928766,21.0624351 13.65,21.0624351 C15.0771234,21.0624351 15.5371234,21.93 16.85,21.8867585 C18.2012006,21.8567585 19.1043332,20.6826735 19.95,19.47 C20.5259959,18.6282271 20.9753274,17.7013798 21.28,16.72 C19.1849826,15.8568474 17.8015585,14.0172507 17.05,11.97 M15.45,5.85 C16.1392796,4.98278834 16.4855705,3.88550365 16.42,2.77 C15.3547901,2.89265267 14.3761664,3.40698669 13.65,4.22 C12.9497929,5.03216533 12.5784707,6.0897115 12.62,7.17 C13.6896397,7.17931158 14.7106537,6.67719016 15.45,5.85"
                  />
                </svg>
                Continue with Apple
              </button>
            </div>

            {process.env.NEXT_PUBLIC_ALLOW_SIGNUP === 'true' && (
              <div className="text-sm text-center">
                <span className="text-gray-500">Don&apos;t have an account?</span>{' '}
                <Link
                  href="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                >
                  Create one
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </FullHeightPage>
  );
}