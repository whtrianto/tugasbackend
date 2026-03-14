import { NextRequest } from 'next/server';
import { getSupabaseServer, getSetAuthCookie } from '@/lib/supabase';
import { errorResponse, jsonResponse, parseBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = parseBody<{ email?: string; password?: string }>(
      await request.text()
    );
    if (!body) {
      return errorResponse('Invalid JSON body', 400);
    }
    const { email, password } = body;
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return errorResponse('Email and password are required', 400);
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!data.session?.access_token || !data.user) {
      return errorResponse('Login failed', 500);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', data.user.id)
      .single();

    const user = profile ?? {
      id: data.user.id,
      name: data.user.user_metadata?.name ?? '',
      email: data.user.email ?? '',
    };

    const response = jsonResponse({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      token: data.session.access_token,
    });

    response.cookies.set(getSetAuthCookie(), data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (e) {
    console.error('Login error:', e);
    return errorResponse('Internal server error', 500);
  }
}
