# Deploy ke Vercel + Supabase

Panduan singkat untuk menjalankan **Task Manager API** (Next.js) dengan **Supabase** dan deploy di **Vercel**.

---

## Ringkasan project

- **Stack:** Next.js 14, TypeScript, Supabase (Auth + Database)
- **Fitur:** Auth (register/login), profiles, tasks (CRUD), API routes di `/api/*`
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## 1. Supabase

1. Buat project di [supabase.com](https://supabase.com) (atau pakai project yang sudah ada).
2. Di **Project Settings → API** ambil:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (atau key yang aman di client) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (rahasia, hanya server) → `SUPABASE_SERVICE_ROLE_KEY`
3. Pastikan tabel `profiles` dan `tasks` serta kebijakan RLS sudah sesuai (sesuai skema yang dipakai backend).

Jika Anda memakai key dengan format **Publishable** dan **Secret** (mis. `sb_publishable_...` dan `sb_secret_...`):

- **Publishable key** → set sebagai `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Secret key** → set sebagai `SUPABASE_SERVICE_ROLE_KEY`  
  (hanya di environment, **jangan** di-commit ke repo.)

Anda tetap butuh **Project URL** dari dashboard Supabase untuk `NEXT_PUBLIC_SUPABASE_URL`.

---

## 2. Environment variables (lokal)

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` dan isi:

- `NEXT_PUBLIC_SUPABASE_URL` = URL project Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Publishable / anon key
- `SUPABASE_SERVICE_ROLE_KEY` = Secret / service_role key

Jangan commit `.env.local` (sudah di-ignore di `.gitignore`).

---

## 3. Deploy ke Vercel

1. Push kode ke GitHub (atau Git provider yang dipakai Vercel).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → impor repo ini.
3. **Framework Preset:** Next.js (biasanya terdeteksi otomatis).
4. Di **Environment Variables** tambahkan:

   | Name                         | Value                    | Environment   |
   |-----------------------------|--------------------------|---------------|
   | `NEXT_PUBLIC_SUPABASE_URL`  | `https://xxx.supabase.co`| Production, Preview |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key Anda | Production, Preview |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret key Anda          | Production, Preview |

   **Penting:** Jangan masukkan **Secret key** ke dalam kode atau repo; hanya di env Vercel.

5. Deploy. Setelah selesai, URL production akan seperti: `https://your-project.vercel.app`.

---

## 4. Setelah deploy

- **API:** Contoh base URL: `https://your-project.vercel.app/api`  
  - Users: `POST/GET /api/users`, `POST /api/users/login`, dll.  
  - Tasks: `GET/POST /api/tasks`, `GET /api/tasks/my-tasks`, dll.
- Jika frontend memakai domain lain, atur **Supabase → Authentication → URL Configuration** (Site URL / Redirect URLs) sesuai domain Vercel Anda.

---

## 5. Checklist

- [ ] Project Supabase aktif dan tabel + RLS sudah sesuai
- [ ] `.env.local` terisi untuk development (tanpa commit)
- [ ] Env vars di Vercel sudah di-set (termasuk Secret key hanya di dashboard)
- [ ] Build di Vercel sukses (`npm run build`)
- [ ] Supabase Auth URL/redirect disesuaikan dengan domain Vercel
