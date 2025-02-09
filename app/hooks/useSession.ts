'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { navigationConfig } from '@/app/config/navigation';

export type User = {
  id: string;
  email: string;
  name?: string;
};

export type Session = {
  user: User;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Don't check session on auth routes
  const isAuthRoute = navigationConfig.noNavbarRoutes.some(route => 
    pathname.startsWith(route)
  );

  useEffect(() => {
    async function checkSession() {
      if (isAuthRoute) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, [isAuthRoute]);

  return { session, isLoading };
} 