// components/withAuth.tsx
import { useRouter } from 'next/navigation';
import { auth } from '@/auth';

const withAuth = (Component: React.FC) => {
  const AuthenticatedComponent = (props: React.ComponentProps<typeof Component>) => {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    if (loading) return <p>Loading...</p>;
    if (!user) {
      router.push('/login');
      return null;
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;

  return AuthenticatedComponent;
};

export default withAuth;