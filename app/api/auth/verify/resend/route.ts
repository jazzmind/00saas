import { NextRequest } from "next/server";
import { sendOTP } from "@/app/lib/auth/emailOTP";
import { getUserByEmail } from "@/app/lib/database/userDatabase";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await sendOTP({
      email,
      userId: user.id,
      purpose: 'verification',
      redirectPath: '/dashboard'
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'New verification code sent' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Resend error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to resend verification code' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 