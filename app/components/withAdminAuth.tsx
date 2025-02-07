// components/withAdminAuth.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const withAdminAuth = (WrappedComponent: React.FC) => {
  const RequiresAuth: React.FC = props => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        const res = await fetch('/api/check-auth?admin=1');
        if (res.status === 200) {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
        }
      };
      checkAuth();
    }, [router]);

    if (!isAuthenticated) {
      return <p>Loading...</p>;
    }

    return <WrappedComponent {...props} />;
  };

  return RequiresAuth;
};

export default withAdminAuth;