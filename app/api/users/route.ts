import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { errorResponse, jsonResponse, parseBody } from '@/lib/api-utils';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = parseBody<{ name?: string; email?: string; password?: string }>(
      await request.text()
    );
    if (!body) {
      return errorResponse('Invalid JSON body', 400);
    }
    const { name, email, password } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Name is required', 400);
    }
    if (!email || typeof email !== 'string' || !validateEmail(email)) {
      return errorResponse('Valid email is required', 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    const supabase = getSupabaseServer();
    const emailNorm = email.trim().toLowerCase();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: emailNorm,
      password,
      options: { data: { name: name.trim() } },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        return errorResponse('Email already registered', 409);
      }
      return errorResponse(signUpError.message || 'Registration failed', 400);
    }

    if (!authData.user) {
      return errorResponse('Registration failed', 500);
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      name: name.trim(),
      email: emailNorm,
    });

    if (profileError) {
      return errorResponse(profileError.message || 'Failed to create profile', 500);
    }

    const profile = await supabase
      .from('profiles')
      .select('id, name, email, created_at')
      .eq('id', authData.user.id)
      .single();

    return jsonResponse({
      success: true,
      user: profile.data,
    }, 201);
  } catch (e) {
    console.error('Register error:', e);
    return errorResponse('Internal server error', 500);
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, email, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      return errorResponse(error.message || 'Failed to list users', 500);
    }
    return jsonResponse({ success: true, users: users ?? [] });
  } catch (e) {
    console.error('List users error:', e);
    return errorResponse('Internal server error', 500);
  }
}
