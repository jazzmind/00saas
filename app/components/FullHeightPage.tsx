'use client';

import { usePathname } from 'next/navigation';
import { navigationConfig } from '@/app/config/navigation';
import NAVBAR_HEIGHT from '@/app/components/Navigation';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function FullHeightPage({ children, className = '' }: Props) {
  const pathname = usePathname();
  const noNavbar = navigationConfig.noNavbarRoutes.some(route => 
    pathname.startsWith(route)
  );

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ 
        minHeight: noNavbar ? '100vh' : `calc(100vh - ${NAVBAR_HEIGHT}px)`
      }}
    >
      {children}
    </div>
  );
} 