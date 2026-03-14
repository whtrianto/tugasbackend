import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { errorResponse, jsonResponse } from '@/lib/api-utils';

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
    const { data: userExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (!userExists) {
      return errorResponse('User not found', 404);
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, user_id, title, description, completed, created_at, updated_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(error.message || 'Failed to get tasks', 500);
    }
    return jsonResponse({ success: true, tasks: tasks ?? [] });
  } catch (e) {
    console.error('Get user tasks error:', e);
    return errorResponse('Internal server error', 500);
  }
}
