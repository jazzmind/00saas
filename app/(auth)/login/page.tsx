"use client";
// pages/login.tsx
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FullHeightPage from '@/app/components/FullHeightPage';
import { handleProviderSignIn, handleEmailProviderSignin } from '@/app/(auth)/login/actions';
import { providerMap } from "@/auth.config"
import Image from 'next/image';
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

export default function SignInPage(props: {
  searchParams: { callbackUrl: string | undefined }
}) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const [state, setState] = useState<LoginState>({
    email: '',
    error: null,
    isLoading: false,
  });

  const handleEmailSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    await handleEmailProviderSignin(state.email, callbackUrl);
  }

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
            <form onSubmit={handleEmailSignin} className="space-y-4">
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
                <span className="px-2 bg-white text-gray-500"> or </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
            {Object.values(providerMap).map((provider) => (
              <form
                key={provider.id}
                action={async () => {
                  await handleProviderSignIn(provider.id, props.searchParams?.callbackUrl ?? "");
                }}
              >
                <button type="submit" className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                  <span>Sign in with {provider.name}</span>
                    <Image src={`https://authjs.dev/img/providers/${provider.id}.svg`} alt={provider.name} width={20} height={20} className="w-4 h-4 ml-2" />
                </button>
              </form> 
            ))}
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