import { getApiSession } from '@/lib/auth/getApiSession';

export async function GET() {
  const { userId, organizationId } = getApiSession();
  
  // Use userId and organizationId directly
  // If this route is hit, we know the JWT is valid
  // and the session exists
  
  return new Response(JSON.stringify({ 
    data: 'some data' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
} 