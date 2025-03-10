import { deleteSession } from "@/lib/session";
import { getApiSession } from "@/lib/auth/getApiSession";
export async function POST() {
  try {
    const session = await getApiSession();
    await deleteSession(session.sessionId);
    return new Response(null, {
      status: 200,
      headers: {
        'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(null, { status: 500 });
  }
} 