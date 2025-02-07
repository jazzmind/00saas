'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Organization } from '../lib/types';

interface NavigationProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function Navigation({ currentUser }: NavigationProps) {
  const pathname = usePathname();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetch('/api/organizations')
        .then(res => res.json())
        .then(data => {
          setOrganizations(data.organizations);
          if (data.organizations.length > 0) {
            setActiveOrg(data.organizations[0]);
          }
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching organizations:', error);
          setIsLoading(false);
        });
    }
  }, [currentUser]);

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                00SaaS
              </Link>
            </div>

            {/* Organization Switcher */}
            {currentUser && organizations.length > 0 && (
              <div className="ml-6 flex items-center">
                <div className="relative">
                  <button
                    onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <span>{activeOrg?.name || 'Select Organization'}</span>
                    <svg
                      className={`h-5 w-5 transform ${isOrgDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOrgDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="menu">
                        {organizations.map(org => (
                          <button
                            key={org.id}
                            onClick={() => {
                              setActiveOrg(org);
                              setIsOrgDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm ${
                              activeOrg?.id === org.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            {org.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {[
                { name: 'Home', href: '/home' }
              ].map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(link.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Account Dropdown */}
          {currentUser && (
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative">
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {currentUser.name?.[0]?.toUpperCase() || 'A'}
                    </span>
                  </div>
                </button>

                {isAccountDropdownOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                      <div className="px-4 py-2 text-xs text-gray-500">
                        Signed in as<br />
                        <strong>{currentUser.email}</strong>
                      </div>
                      
                      <div className="border-t border-gray-100" />
                      
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        Profile
                      </Link>

                      {activeOrg && (
                        <>
                          {['owner', 'admin'].includes(organizations.find(o => o.id === activeOrg.id)?.members?.[0]?.role || '') && (
                            <Link
                              href={`/organizations/${activeOrg.id}/admin`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsAccountDropdownOpen(false)}
                            >
                              Organization Admin
                            </Link>
                          )}
                          
                          {activeOrg.members?.[0]?.role === 'owner' && (
                            <Link
                              href={`/organizations/${activeOrg.id}/billing`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsAccountDropdownOpen(false)}
                            >
                              Billing
                            </Link>
                          )}
                        </>
                      )}

                      <div className="border-t border-gray-100" />

                      <button
                        onClick={() => {
                          // Handle logout
                          setIsAccountDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon */}
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 