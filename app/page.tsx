'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleAdminLogin = () => {
    router.push('/admin/dashboard');
  };

  const handleSendMagicLink = async () => {
    try {
      const response = await fetch('/api/auth/send-login-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({mode: 'login', email, proposalId: -1}),
      });

      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }

      alert('Magic link sent to your email');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative h-[33vh] bg-gray-800 flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
        src="/images/banner.jpg"
        alt="Banner"
        layout="fill"
        objectFit="cover"
        className="opacity-50"
          />
        </div>
        <h1 className="text-4xl font-bold text-white z-10">00SaaS</h1>
      </div>
      <div className="flex flex-1 p-8">
        <div className="w-1/2 p-4">
          <h2 className="text-2xl font-semibold mb-4">Looking for a proposal?</h2>
          <p className="mb-4">
            If there are proposals associated with your email address you&apos;ll get a link to automatically log in.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <button
            onClick={handleSendMagicLink}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Send Magic Link
          </button>
        </div>
        <div className="w-1/2 p-4">
          <h2 className="text-2xl font-semibold mb-4">Manage Proposals</h2>
          <button
            onClick={handleAdminLogin}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;