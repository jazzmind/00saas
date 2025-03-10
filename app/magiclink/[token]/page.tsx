import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth/emailOTP';
import { cookies } from 'next/headers';

export default async function MagicLinkPage({ params }: { params: { token: string } }) {
  try {
    const { userId, redirectPath } = await verifyToken(params.token);
    
    // Set auth cookie
    (await cookies()).set('auth', userId, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    redirect(redirectPath);
  } catch (error) {
    console.error(error);
    redirect('/login?error=invalid-link');
  }
} 