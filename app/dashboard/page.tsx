'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiJson, clearToken, getToken } from '@/lib/api-client';

interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadTasks = async () => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    try {
      const res = await apiJson<{ success: boolean; tasks: Task[] }>('/api/tasks/my-tasks');
      if (res.success) setTasks(res.tasks);
    } catch {
      clearToken();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleLogout = () => {
    clearToken();
    router.replace('/login');
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await apiJson(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...task, completed: !task.completed }),
      });
      setMessage({ type: 'success', text: 'Status task diperbarui.' });
      loadTasks();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal update.' });
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Hapus task "${title}"?`)) return;
    try {
      await apiJson(`/api/tasks/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Task dihapus.' });
      loadTasks();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal hapus.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat task...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Task Manager</h1>
          <div className="flex gap-2 items-center">
            <Link
              href="/tasks/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              + Task Baru
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Daftar Task Saya</h2>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Belum ada task.{' '}
            <Link href="/tasks/new" className="text-blue-600 hover:underline">
              Buat task pertama
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="bg-white rounded-lg shadow-sm border p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title={task.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {task.completed ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : null}
                    </button>
                    <span
                      className={`font-medium ${
                        task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.completed && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Selesai
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-600 ml-7">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id, task.title)}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
