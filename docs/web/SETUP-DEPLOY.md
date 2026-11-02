# Setup & Deploy

## 1. Prasyarat

- Node.js 20 LTS atau lebih baru (`node -v`), Git, akun GitHub dengan akses ke `izviopm/uts-ai-banjir-ciledug`.
- Akun Vercel yang tersambung ke GitHub (cukup salah satu anggota, disarankan Izvio sebagai pemilik repo).

## 2. Membuat proyek Next.js di folder `web/`

Folder `web/` **sudah berisi** `public/model/` dan `fixtures/`. `create-next-app` menolak folder yang tidak kosong, jadi buat di folder
sementara lalu pindahkan:

```bash
git clone https://github.com/izviopm/uts-ai-banjir-ciledug.git
cd uts-ai-banjir-ciledug
npx create-next-app@latest web-baru --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm
# pindahkan isi web-baru ke web/ TANPA menimpa web/public/model dan web/fixtures
cp -rn web-baru/. web/        # di Windows: salin manual lewat Explorer, pilih "Skip" untuk file yang sudah ada
rm -rf web-baru
cd web
```

## 3. Dependensi

```bash
npm install daisyui@5 motion leaflet react-leaflet @supabase/supabase-js sastrawijs
npm install -D vitest @types/leaflet
```

Aktifkan daisyUI di `app/globals.css` (Tailwind 4):
```css
@import "tailwindcss";
@plugin "daisyui" { themes: light --default, dark --prefersdark; }
```

animate-ui (opsional): ikuti dokumentasi di situsnya untuk menyalin **komponen tertentu saja** lewat shadcn CLI. Jangan menjalankan
inisialisasi tema shadcn penuh, karena variabel warnanya bisa menimpa tema daisyUI. Jika bentrok, cukup pakai `motion` langsung.

Leaflet di Next.js: impor CSS `leaflet/dist/leaflet.css` di komponen peta, dan muat komponen peta dengan
`dynamic(() => import("@/components/PetaRute"), { ssr: false })`, karena Leaflet membutuhkan `window`.

> Versi terbaru saat dokumen ini ditulis (2 Nov 2026): next 16.4, react 19.3, tailwindcss 4.3, daisyui 5.7, motion 14.9,
> react-leaflet 5.0, leaflet 1.9.4, @supabase/supabase-js 2.118, vitest 5.0, sastrawijs 1.1.0. Jika ada perubahan besar, ikuti dokumentasi resmi masing-masing.

## 4. Environment variable

Salin `web/.env.example` menjadi `web/.env.local`. Isinya **publishable key**, yang memang aman dipakai di browser karena database hanya
mengizinkan `SELECT` (RLS). **Jangan pernah** memakai `service_role`/secret key atau password database di web.

## 5. Menjalankan lokal

```bash
npm run dev        # http://localhost:3000
npm test           # vitest: semua uji fixtures harus lulus
npm run build      # pastikan build produksi sukses sebelum deploy
```

## 6. Deploy ke Vercel

1. vercel.com → **Add New… → Project** → impor `izviopm/uts-ai-banjir-ciledug`.
2. **Root Directory: `web`** (penting, karena repo juga berisi notebook dan data).
3. Framework terdeteksi otomatis: Next.js.
4. **Environment Variables**: tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nilai sama dengan `.env.example`).
5. **Deploy**. Setiap push ke `main` akan deploy ulang otomatis; branch lain menghasilkan *preview URL*.
6. Uji link produksi dari HP dan dari jaringan lain.

## 7. Alur kerja Git untuk kelompok

- Kerjakan di branch `web` (atau `fitur/<nama>`), buka Pull Request ke `main`. Izvio meninjau sebelum merge.
- Jangan commit `.env.local`, `node_modules/`, `.next/` (sudah ada di `.gitignore` root).
- File di `public/model/` dan `fixtures/` hanya diubah lewat notebook/skrip oleh Izvio.

## 8. Checklist sebelum presentasi

- [ ] `npm test` hijau semua
- [ ] Semua halaman P0 di PRD berfungsi di link Vercel
- [ ] Dibuka di HP (375 px) tetap rapi
- [ ] Supabase tidak dalam status *Paused* (buka dashboard sehari sebelumnya)
- [ ] Alur demo di PRD §5 sudah dilatih minimal sekali
