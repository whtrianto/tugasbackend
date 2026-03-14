import { NextRequest } from 'next/server';
import { getSupabaseServer, getAuthFromRequest } from '@/lib/supabase';
import { errorResponse, jsonResponse, parseBody } from '@/lib/api-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return errorResponse('Invalid task ID', 400);
    }

    const supabase = getSupabaseServer();
    const { data: task, error } = await supabase
      .from('tasks')
      .select('id, user_id, title, description, completed, created_at, updated_at')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      return errorResponse('Task not found', 404);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', task.user_id)
      .single();

    const normalized = {
      ...task,
      user_name: profile?.name,
      user_email: profile?.email,
    };
    return jsonResponse({ success: true, task: normalized });
  } catch (e) {
    console.error('Get task error:', e);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return errorResponse('Authentication required', 401);
  }
  try {
    const { id } = params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return errorResponse('Invalid task ID', 400);
    }

    const supabase = getSupabaseServer();
    const { data: existing, error: fetchError } = await supabase
      .from('tasks')
      .select('id, user_id, title, description, completed')
      .eq('id', taskId)
      .single();

    if (fetchError || !existing) {
      return errorResponse('Task not found', 404);
    }
    if (existing.user_id !== auth.userId) {
      return errorResponse('Forbidden', 403);
    }

    const body = parseBody<{ title?: string; description?: string; completed?: boolean }>(
      await request.text()
    );
    if (!body) {
      return errorResponse('Invalid JSON body', 400);
    }

    let title = existing.title;
    let description = existing.description;
    let completed = existing.completed;

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return errorResponse('Title cannot be empty', 400);
      }
      title = body.title.trim();
    }
    if (body.description !== undefined) {
      description = typeof body.description === 'string' ? body.description.trim() || null : null;
    }
    if (body.completed !== undefined) {
      completed = body.completed === true;
    }

    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update({ title, description, completed })
      .eq('id', taskId)
      .select('id, user_id, title, description, completed, created_at, updated_at')
      .single();

    if (updateError) {
      return errorResponse(updateError.message || 'Update failed', 500);
    }
    return jsonResponse({ success: true, task });
  } catch (e) {
    console.error('Update task error:', e);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return errorResponse('Authentication required', 401);
  }
  try {
    const { id } = params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return errorResponse('Invalid task ID', 400);
    }

    const supabase = getSupabaseServer();
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, user_id')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      return errorResponse('Task not found', 404);
    }
    if (task.user_id !== auth.userId) {
      return errorResponse('Forbidden', 403);
    }

    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);
    if (deleteError) {
      return errorResponse(deleteError.message || 'Delete failed', 500);
    }
    return jsonResponse({ success: true, message: 'Task deleted' });
  } catch (e) {
    console.error('Delete task error:', e);
    return errorResponse('Internal server error', 500);
  }
}
