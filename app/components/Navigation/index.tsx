'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationConfig } from '@/app/config/navigation';
import { useSession } from '@/app/hooks/useSession';

export default function Navigation() {
  const pathname = usePathname();
  const { session } = useSession();
  
  // Don't show navbar on specified routes
  if (navigationConfig.noNavbarRoutes.some(path => pathname?.startsWith(path))) {
    return null;
  }

  const isLoggedIn = !!session;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold">
                {navigationConfig.platformName}
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!isLoggedIn && (
              // Show login/signup for logged out users
              navigationConfig.loggedOutNavRoutes.map(route => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={route.class || "text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"}
                >
                  {route.label}
                </Link>
              ))
            )}
            
            {isLoggedIn && (
              // Show user menu for logged in users
              <div className="relative">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                {/* Add user menu/profile here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 