export type NavRoute = {
  path: string;
  label: string;
  class?: string;
  icon?: string;
};

export type NavigationConfig = {
  navRoutes: NavRoute[];
  loggedOutNavRoutes: NavRoute[];
  noNavbarRoutes: string[];
  noLoginRequiredRoutes: string[];
  platformName: string;
  logoUrl?: string;
};

export const navigationConfig: NavigationConfig = {
  navRoutes: [
    {
      path: '/',
      label: 'Home'
    }
  ],

  noNavbarRoutes: [
    '/verify',
    '/magiclink',
    '/passkey',
  ],
  
  noLoginRequiredRoutes: [
    '/login',
    '/signup',
    '/verify',
    '/magiclink'
  ],

  platformName: 'Your Platform',
  
  loggedOutNavRoutes: [
    {
      path: '/login',
      label: 'Login',
      class: 'text-sm text-gray-900 px-4 py-2 rounded-md'
    },
    {
      path: '/signup',
      label: 'Sign Up',
      class: 'text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-md' // outline button
    }
  ]
}; 