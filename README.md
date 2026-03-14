# Task Manager API

Aplikasi Task Manager API sederhana untuk mengelola aktivitas harian. Membantu tim dalam mencatat, mengatur, dan mengelola task dengan fitur user management, CRUD task, dan relasi one-to-many antara users dan tasks.

**Deploy:** Vercel  
**Database:** Supabase (PostgreSQL + Auth)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
- **Styling:** Tailwind CSS

## Fitur

- **Manajemen User:** Registrasi, login, autentikasi via Supabase Auth
- **CRUD Tasks:** Create, Read, Update, Delete dengan relasi ke user
- **Validasi & Error Handling:** Validasi input dan response error yang konsisten
- **Relasi Database:** One-to-many (profiles → tasks)
- **Frontend:** Login/Register, Dashboard task, form Create/Edit task, toggle completed, delete dengan konfirmasi

## Cara Install & Run

### Prerequisites

- Node.js 18+
- Akun Supabase (gratis di [supabase.com](https://supabase.com))

### Langkah-langkah

1. **Clone repository**
   ```bash
   git clone <url-repo>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Supabase**
   - Buat project baru di [Supabase Dashboard](https://app.supabase.com).
   - Di **Project Settings → API** ambil:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
   - Di **Authentication → Providers** bisa matikan **Confirm email** jika ingin login langsung tanpa konfirmasi email.

4. **Setup database di Supabase**
   - Buka **SQL Editor** di Supabase Dashboard.
   - Jalankan isi file `supabase/migrations/001_initial.sql` (copy-paste lalu Run).

5. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` dan isi nilai dari Supabase (lihat langkah 3).

6. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

7. **Build untuk production**
   ```bash
   npm run build
   npm start
   ```

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Di [Vercel](https://vercel.com), **Add New Project** → import repo.
3. Tambahkan **Environment Variables** (sama dengan `.env`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (Opsional) `NEXT_PUBLIC_APP_URL` = URL production, misalnya `https://your-app.vercel.app`
4. Deploy. Setelah selesai, cantumkan **Live URL** di bawah.

## Environment Variables

| Variable | Deskripsi | Di mana dapat |
|----------|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (rahasia) | Supabase → Settings → API |
| `NEXT_PUBLIC_APP_URL` | URL aplikasi (opsional) | Mis. `http://localhost:3000` atau URL Vercel |

**Penting:** Jangan expose `SUPABASE_SERVICE_ROLE_KEY` di frontend; hanya dipakai di API routes server.

## Setup Database (Supabase)

1. Buat project di [Supabase](https://app.supabase.com).
2. Buka **SQL Editor**.
3. Copy isi `supabase/migrations/001_initial.sql` dan jalankan (Run).
4. Selesai: tabel `profiles` dan `tasks` beserta indeks dan RLS akan terbentuk.

## API Endpoints

### User

| Method | Endpoint     | Deskripsi        | Auth |
|--------|--------------|------------------|------|
| POST   | `/api/users` | Register user    | No   |
| GET    | `/api/users` | List semua user  | No   |
| GET    | `/api/users/:id` | Get user by ID (UUID) | No   |
| PUT    | `/api/users/:id` | Update user   | No   |
| DELETE | `/api/users/:id` | Delete user   | No   |
| POST   | `/api/users/login` | Login       | No   |

### Task

| Method | Endpoint           | Deskripsi              | Auth |
|--------|--------------------|------------------------|------|
| POST   | `/api/tasks`       | Create task            | Yes  |
| GET    | `/api/tasks`       | List semua task        | No   |
| GET    | `/api/tasks/my-tasks` | Task milik user login | Yes  |
| GET    | `/api/tasks/:id`   | Get task by ID         | No   |
| PUT    | `/api/tasks/:id`   | Update task            | Yes  |
| DELETE | `/api/tasks/:id`   | Delete task            | Yes  |
| GET    | `/api/users/:id/tasks` | Task by user ID (UUID) | No   |

**Auth:** Request yang memerlukan auth harus menyertakan header `Authorization: Bearer <token>` atau cookie `task_manager_token` (token dari Supabase setelah login).

## Contoh Request/Response

### Register

```http
POST /api/users
Content-Type: application/json

{
  "name": "Budi",
  "email": "budi@example.com",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Budi",
    "email": "budi@example.com",
    "created_at": "2025-03-14T10:00:00.000Z"
  }
}
```

### Login

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "budi@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "user": { "id": "550e8400-...", "name": "Budi", "email": "budi@example.com" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Create Task (Auth required)

```http
POST /api/tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Rapat tim",
  "description": "Rapat mingguan",
  "completed": false
}
```

**Response 201:**
```json
{
  "success": true,
  "task": {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Rapat tim",
    "description": "Rapat mingguan",
    "completed": false,
    "created_at": "2025-03-14T10:00:00.000Z",
    "updated_at": "2025-03-14T10:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Pesan error"
}
```

Status code umum: `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `500` Internal Server Error.

## Live URL

(Setelah deploy ke Vercel, cantumkan URL di sini.)

Contoh: `https://task-manager-api.vercel.app`

---

**Catatan:** Jangan commit `node_modules` atau file `.env`. Gunakan `.env.example` sebagai referensi.
