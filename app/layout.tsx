import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/app/components/Navigation/index';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Your Application',
  description: 'Your application description',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  const isAuthRoute = pathname.startsWith('/login') || 
                     pathname.startsWith('/verify') || 
                     pathname.startsWith('/signup');

  return (
    <html lang="en">
      <body className={inter.className}>
        {!isAuthRoute && <Navigation />}
        {children}
      </body>
    </html>
  );
}