import { NextRequest } from 'next/server';
import { getSupabaseServer, getAuthFromRequest } from '@/lib/supabase';
import { errorResponse, jsonResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return errorResponse('Authentication required', 401);
  }
  try {
    const supabase = getSupabaseServer();
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, user_id, title, description, completed, created_at, updated_at')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(error.message || 'Failed to get tasks', 500);
    }
    return jsonResponse({ success: true, tasks: tasks ?? [] });
  } catch (e) {
    console.error('My tasks error:', e);
    return errorResponse('Internal server error', 500);
  }
}
