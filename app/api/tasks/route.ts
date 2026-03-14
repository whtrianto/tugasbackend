import { NextRequest } from 'next/server';
import { getSupabaseServer, getAuthFromRequest } from '@/lib/supabase';
import { errorResponse, jsonResponse, parseBody } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return errorResponse('Authentication required', 401);
  }
  try {
    const body = parseBody<{ title?: string; description?: string; completed?: boolean }>(
      await request.text()
    );
    if (!body) {
      return errorResponse('Invalid JSON body', 400);
    }
    const title = body.title;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return errorResponse('Title is required', 400);
    }
    const description =
      body.description != null && typeof body.description === 'string'
        ? body.description.trim() || null
        : null;
    const completed = body.completed === true;

    const supabase = getSupabaseServer();
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: auth.userId,
        title: title.trim(),
        description,
        completed,
      })
      .select('id, user_id, title, description, completed, created_at, updated_at')
      .single();

    if (error) {
      return errorResponse(error.message || 'Failed to create task', 500);
    }
    return jsonResponse({ success: true, task }, 201);
  } catch (e) {
    console.error('Create task error:', e);
    return errorResponse('Internal server error', 500);
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, user_id, title, description, completed, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(error.message || 'Failed to list tasks', 500);
    }

    const list = tasks ?? [];
    if (list.length === 0) {
      return jsonResponse({ success: true, tasks: [] });
    }

    const userIds = Array.from(new Set(list.map((t: { user_id: string }) => t.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p: { id: string; name: string; email: string }) => [p.id, p])
    );

    const normalized = list.map((t: Record<string, unknown> & { user_id: string }) => {
      const p = profileMap.get(t.user_id);
      return {
        ...t,
        user_name: p?.name,
        user_email: p?.email,
      };
    });
    return jsonResponse({ success: true, tasks: normalized });
  } catch (e) {
    console.error('List tasks error:', e);
    return errorResponse('Internal server error', 500);
  }
}
