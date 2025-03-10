import { NextRequest } from 'next/server';
import { getUser, updateUser } from '@/lib/database/userDatabase';
import { getApiSession } from '@/lib/auth/getApiSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const snoozedUntil = body.snoozedUntil;
    const { userId } = await getApiSession();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(userId);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Set snooze for 2 weeks
    await updateUser(userId, {
      passkeySnoozedUntil: snoozedUntil
    });

    return Response.json({ snoozedUntil });
  } catch (error) {
    console.error('Error snoozing passkey prompt:', error);
    return Response.json(
      { error: 'Failed to snooze passkey prompt' },
      { status: 500 }
    );
  }
} 