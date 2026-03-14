const getBaseUrl = () =>
  typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('task_manager_token');
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('task_manager_token', token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('task_manager_token');
}

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, ...rest } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((rest.headers as Record<string, string>) || {}),
  };
  const t = token !== undefined ? token : getToken();
  if (t) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${t}`;
  }
  const url = `${getBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
  return fetch(url, { ...rest, headers });
}

export async function apiJson<T>(path: string, options?: RequestInit & { token?: string | null }): Promise<T> {
  const res = await apiFetch(path, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  }
  return data as T;
}
