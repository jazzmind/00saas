// pages/api/check-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { getUser } from '../../lib/database/userDatabase';
import { verify } from '../../lib/auth/auth';

export const GET = async (req: NextRequest) => {
  // for admin routes, the cookie name is 'admin_auth' and for user routes, the cookie name is 'auth'
  // if we're checking admin auth, we set the query parameter 'admin' = 1
  const admin = req.nextUrl.searchParams.get('admin');
  const cookieName = admin ? 'admin_auth' : 'auth';
  const cookies = parse(req.headers.get('Cookie') || '');

  // the cookie is a JWT token that contains the userId
  // verify the token and check if the user exists  
  const token = cookies[cookieName];  
  if (!token) {
    return new NextResponse("no cookie", { status: 401 });
  }

  let userId;
  try {
    userId = await verify(token);
  } catch (e) {
    console.log(e); 
    return new NextResponse(null, { status: 401 });
  }

  if (!userId) {
    return new NextResponse(null, { status: 401 });
  }

  const user = await getUser(userId);
  if (user) {
    return NextResponse.json({ authenticated: true });
  } else {
    return new NextResponse(null, { status: 401 });
  }
};
