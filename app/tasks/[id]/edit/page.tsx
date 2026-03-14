'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { apiJson, getToken } from '@/lib/api-client';

interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    if (!id) return;
    apiJson<{ success: boolean; task: Task }>(`/api/tasks/${id}`)
      .then((res) => {
        if (res.success && res.task) {
          setTitle(res.task.title);
          setDescription(res.task.description || '');
          setCompleted(res.task.completed === true);
        }
      })
      .catch(() => setError('Task tidak ditemukan.'))
      .finally(() => setFetching(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiJson(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          completed,
        }),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan task.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
            ← Kembali
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Edit Task</h1>
          <span />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Judul Task *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: Rapat tim"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi (opsional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detail task..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="completed"
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="completed" className="text-sm text-gray-700">
                Tandai sebagai selesai
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium"
              >
                Batal
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
