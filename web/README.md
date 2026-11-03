# Web Demo — Agen Cerdas Tanggap Banjir Ciledug

Next.js 16 + TypeScript + Tailwind 4 + daisyUI 5 + Leaflet.

> Panduan langkah demi langkah dari install sampai verifikasi: [`PANDUAN.md`](./PANDUAN.md).

## Menjalankan

```bash
npm install
cp .env.example .env.local   # opsional; kosongkan bila belum punya Supabase
npm run dev                  # http://localhost:3000
```

## Uji & build

```bash
npm test         # 130 kasus: 32 preprocessing, 32 NB, 56 searching, 10 Hybrid TF-IDF
npm run typecheck
npm run build
```

Seluruh hasil uji harus identik dengan `fixtures/` yang dihasilkan `scripts/buat_fixtures_web.py`.

## Data

| Folder | Isi | Jangan diubah |
|---|---|---|
| `public/model/` | Model NB, stem, graf Ciledug, klaster & ringkasan | Ya — hasil notebook |
| `fixtures/` | Kasus uji dari Python | Ya |
| `data/angka.json` | Salinan `laporan/angka.json` untuk fallback metrik | Tidak (salinan) |

`public/model/graph_ciledug.json` (±1,8 MB) hanya dimuat di halaman `/rute`.

## Halaman

| Rute | Fitur |
|---|---|
| `/` | Beranda, alur agen, angka kunci |
| `/klaster` | Sebaran, 11 kartu klaster, ringkas sendiri (F3), ROUGE (F8) |
| `/rute` | Peta Leaflet, A*/UCS/BFS/DFS, animasi, banding, benchmark (F7), klik peta (F11) |
| `/klasifikasi` | Metrik 3 model, confusion matrix, uji tweet (F6) |
| `/tentang` | Tim, dataset, sumber genangan, keterbatasan |

## Supabase (opsional)

Isi `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Hanya **publishable key** (akses SELECT). Bila kosong atau gagal, halaman memakai `data/angka.json`
dan menampilkan banner peringatan.
