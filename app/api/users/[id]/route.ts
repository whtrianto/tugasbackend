import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { errorResponse, jsonResponse, parseBody } from '@/lib/api-utils';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUuid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const supabase = getSupabaseServer();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, email, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return errorResponse('User not found', 404);
    }
    return jsonResponse({ success: true, user });
  } catch (e) {
    console.error('Get user error:', e);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUuid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const body = parseBody<{ name?: string; email?: string; password?: string }>(
      await request.text()
    );
    if (!body) {
      return errorResponse('Invalid JSON body', 400);
    }

    const supabase = getSupabaseServer();
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return errorResponse('User not found', 404);
    }

    let name = existing.name;
    let email = existing.email;

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return errorResponse('Name cannot be empty', 400);
      }
      name = body.name.trim();
    }

    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !validateEmail(body.email)) {
        return errorResponse('Valid email is required', 400);
      }
      const emailNorm = body.email.trim().toLowerCase();
      const { data: other } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailNorm)
        .neq('id', id)
        .maybeSingle();
      if (other) {
        return errorResponse('Email already in use', 409);
      }
      email = emailNorm;
    }

    const updates: { name?: string; email?: string } = {};
    if (name !== existing.name) updates.name = name;
    if (email !== existing.email) updates.email = email;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      if (updateError) {
        return errorResponse(updateError.message || 'Update failed', 500);
      }
    }

    if (body.email !== undefined && body.email.trim().toLowerCase() !== existing.email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email: body.email.trim().toLowerCase(),
      });
      if (authError) {
        return errorResponse(authError.message || 'Failed to update email', 500);
      }
    }

    if (body.password !== undefined) {
      if (typeof body.password !== 'string' || body.password.length < 6) {
        return errorResponse('Password must be at least 6 characters', 400);
      }
      const { error: pwError } = await supabase.auth.admin.updateUserById(id, {
        password: body.password,
      });
      if (pwError) {
        return errorResponse(pwError.message || 'Failed to update password', 500);
      }
    }

    const { data: user } = await supabase
      .from('profiles')
      .select('id, name, email, created_at, updated_at')
      .eq('id', id)
      .single();

    return jsonResponse({ success: true, user });
  } catch (e) {
    console.error('Update user error:', e);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUuid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      if (error.message.includes('not found')) {
        return errorResponse('User not found', 404);
      }
      return errorResponse(error.message || 'Delete failed', 500);
    }
    return jsonResponse({ success: true, message: 'User deleted' });
  } catch (e) {
    console.error('Delete user error:', e);
    return errorResponse('Internal server error', 500);
  }
}
