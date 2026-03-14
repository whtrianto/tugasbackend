import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let serverClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!serverClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    serverClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return serverClient;
}

export interface AuthUser {
  userId: string;
  email: string;
}

const COOKIE_NAME = 'task_manager_token';

export async function getAuthFromRequest(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  let token: string | null = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  }
  if (!token) return null;

  try {
    const supabase = getSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { userId: user.id, email: user.email ?? '' };
  } catch {
    return null;
  }
}

export function getSetAuthCookie() {
  return COOKIE_NAME;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}
