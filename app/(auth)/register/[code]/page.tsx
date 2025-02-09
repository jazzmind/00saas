"use client";
// pages/register.tsx
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  startRegistration,
} from '@simplewebauthn/browser';
import Cookies from 'js-cookie';

const Register: React.FC = () => {
  const router = useRouter();
  const { code } = useParams();
  const [error, setError] = useState('');

  useEffect(() => {
    if (code) {
      handleRegister(code as string);
    }
  }, [code, router]);

  const handleRegister = async (code: string) => {
    setError('');
    const response = await fetch('/api/verify-login-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      setError('Invalid or missing login code');
      return;
    }

    const user = await response.json();
    console.log('Verify login response', user);

    // if the user is already registered, redirect to dashboard
    if (user.credentials && user.credentials.length > 0 && user.credentials[0].credentialID) {
      router.push('/admin/dashboard');
      return;
    }

    const optionsResponse = await fetch('/api/generate-registration-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });
    const options = await optionsResponse.json();
    console.log('Options response', options);
    const attestationResponse = await startRegistration(options);
    console.log('attestationResponse', attestationResponse);
    const verificationResponse = await fetch('/api/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        attestationResponse,
        options
      }),
    });
    const verification = await verificationResponse.json();

    if (verification.verified) {
      // Registration successful
      // Set authentication cookie and redirect to dashboard
      Cookies.set('admin_auth', user.userId, { expires: 7 });
      router.push('/admin/dashboard');
    } else {
      setError('Registration verification failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>Registering Your Passkey</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>Please follow the instructions on your device to complete the registration.</p>
      </div>
    </div>
  );
};

export default Register;