# Panduan Setup sampai Jalan

Dokumen ini mencatat **proses nyata** menyiapkan web demo dari repo kosong di komputer sampai aplikasi berjalan dan terverifikasi.
Ikuti berurutan; total waktu ±10–15 menit (tanpa deploy).

> Untuk deploy ke Vercel, lihat [`docs/web/SETUP-DEPLOY.md`](../docs/web/SETUP-DEPLOY.md) §6.
> Untuk spesifikasi fitur dan algoritma, lihat [`docs/web/`](../docs/web/).

---

## 0. Ringkasan cepat

Kalau repo sudah di-clone dan kamu hanya ingin menjalankannya:

```bash
cd web
npm ci
npm run dev
# buka http://localhost:3000
```

Empat perintah itu cukup. Sisanya di bawah adalah verifikasi dan penanganan masalah.

---

## 1. Prasyarat

| Kebutuhan | Versi minimal | Cek |
|---|---|---|
| Node.js | 20.9 (disarankan 22/24) | `node -v` |
| npm | 10 | `npm -v` |
| Git | apa saja | `git --version` |
| Browser modern | Chrome/Edge/Firefox/Safari terbaru | — |
| Python | opsional, hanya untuk regenerasi data | `python3 -V` |

Tidak perlu Supabase untuk menjalankan demo. Tanpa env Supabase, aplikasi otomatis memakai data lokal.

---

## 2. Ambil kode

```bash
git clone https://github.com/izviopm/uts-ai-banjir-ciledug.git
cd uts-ai-banjir-ciledug
```

Struktur yang relevan:

```text
uts-ai-banjir-ciledug/
├── docs/web/              # spesifikasi (PRD, UI, ALGORITMA, dll.)
├── notebooks/             # riset Python (tidak dijalankan di web)
├── web/                   # aplikasi Next.js  ← semua perintah di bawah dari sini
│   ├── app/               # 5 halaman
│   ├── components/
│   ├── lib/               # port algoritma Python → TypeScript
│   ├── public/model/      # model hasil riset (JANGAN diubah)
│   ├── fixtures/          # kasus uji dari Python (JANGAN diubah)
│   └── data/angka.json    # fallback metrik & ROUGE
└── laporan/               # laporan & angka.json asli
```

---

## 3. Install dependensi

```bash
cd web

# Disarankan: install persis mengikuti package-lock.json
npm ci

# Alternatif bila lockfile bermasalah
npm install
```

Dependensi utama yang terpasang: Next.js 16, React 19, Tailwind 4, daisyUI 5, Leaflet + react-leaflet, motion,
Supabase JS, Vitest.

> Catatan: `sastrawijs` **tidak dipakai**. Stemming memakai `public/model/stem_lookup.json` (lookup-only) agar hasil
> identik dengan Python.

---

## 4. Konfigurasi environment (opsional)

### 4a. Tanpa Supabase — cukup untuk demo

Tidak perlu membuat `.env.local`. Semua halaman memakai `data/angka.json` dan menampilkan banner:

> “Data database tidak tersedia, menampilkan metrik lokal dari `angka.json`.”

Ini **bukan error**; memang jalur fallback yang dirancang.

### 4b. Dengan Supabase — bila ingin data database

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Aturan:

- Hanya **publishable/anon key** (akses `SELECT`). Jangan pernah memakai `service_role`, secret key, atau password database.
- Schema yang dibaca: `uts_ai_bencana` (tabel `model_metrics`, `search_runs`).
- Env dibaca saat server dijalankan; **restart** `npm run dev` setelah mengubah `.env.local`.
- `.env.local` sudah di-ignore Git.

---

## 5. Cek data riset

Pastikan file model dan fixtures ada dan tidak berubah:

```bash
ls public/model
# graph_ciledug.json  klaster_ringkasan.json  naive_bayes.json  preprocessing.json  stem_lookup.json

ls fixtures
# hybrid_tfidf.json  preprocessing_nb.json  searching.json
```

Angka acuan yang harus cocok:

| File | Isi |
|---|---|
| `preprocessing.json` | 129 stopword, 41 slang |
| `stem_lookup.json` | 3.835 entri |
| `naive_bayes.json` | 2.851 fitur |
| `graph_ciledug.json` | 19.066 node, 43.689 ruas, 7 titik banjir |
| `klaster_ringkasan.json` | 11 klaster, 3.390 tweet, 1.500 titik sebaran |

> **Jangan mengedit** `public/model/` atau `fixtures/` dari sisi web. Perubahan hanya lewat notebook/skrip Python.

---

## 6. Verifikasi otomatis

Jalankan dari `web/`:

```bash
npm test          # 130 kasus fixtures
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run build     # build produksi
```

Hasil yang diharapkan:

```text
Test Files  4 passed (4)
     Tests  130 passed (130)
```

Rincian 130 kasus:

| File uji | Kasus | Yang dicek |
|---|---|---|
| `tests/teks.test.ts` | 32 | hasil preprocessing identik dengan Python |
| `tests/naiveBayes.test.ts` | 32 | `p_laporan` dan label identik |
| `tests/searching.test.ts` | 56 | `path`, `expanded`, `jarak_m`, `biaya`, jejak awal |
| `tests/hybridTfidf.test.ts` | 10 | tweet terpilih dan skor |

Kalau ada yang gagal, jangan mengubah fixtures — periksa apakah `public/model/` termodifikasi.

---

## 7. Jalankan mode pengembangan

```bash
npm run dev
```

Buka **http://localhost:3000**.

Hentikan dengan `Ctrl+C`. Setelah mengubah `.env.local`, hentikan lalu jalankan ulang.

---

## 8. Cek manual tiap halaman

Gunakan daftar ini sebagai bukti demo berjalan. Angka di bawah adalah hasil yang sudah diverifikasi.

### `/` — Beranda
- [ ] Hero dan alur 4 langkah tampil.
- [ ] Angka: **3.390** tweet dianalisis, **1.220** tweet berlabel, **11** klaster, F1 **0,612**, A* vs UCS **4,1×**.
- [ ] Keterangan “skenario banjir, 7 titik” ada di kartu A* vs UCS.
- [ ] Link GitHub dan 4 notebook bisa diklik.

### `/klaster`
- [ ] Sebaran **1.500 tweet** tampil; tombol legenda menyorot klaster.
- [ ] **11 kartu** klaster, masing-masing 3 tweet ringkasan.
- [ ] Tempel 5–10 baris di “Coba ringkas sendiri” → klik **Ringkas** → muncul **“3 baris terpilih dari N baris”**.
- [ ] Tabel ROUGE menampilkan ROUGE-1/2/L dan peringatan **“Peningkatan belum signifikan”**.

### `/rute`
- [ ] Graf termuat (indikator: 7 pilihan titik awal, 19.066 persimpangan).
- [ ] Skenario **Normal**, algoritma **A\***, titik **Jalan Raden Saleh Raya** → **Cari rute**:
      “A* menemukan … sejauh **0,23 km** setelah memeriksa **4** persimpangan.”
- [ ] Ganti **Banjir** → **Cari rute**: jarak **1,73 km** dan keterangan **“Rute memutar +1,50 km”**.
- [ ] **Putar animasi**: titik oranye muncul bertahap; kontrol **kecepatan / Jeda / Lanjut / Ulang** bekerja.
- [ ] **Bandingkan semua** → 4 peta kecil (A*, UCS, BFS, DFS) dan tabel ringkasan.
- [ ] Benchmark di bawah menampilkan tabel; tanpa Supabase muncul banner fallback.
- [ ] Klik sembarang titik di peta → titik awal berpindah ke persimpangan terdekat (F11).

### `/klasifikasi`
- [ ] Tabel metrik 3 model dan 3 confusion matrix tampil.
- [ ] Contoh 1 (laporan banjir) → label **Laporan**, `p(laporan) ≈ 0,9487`.
- [ ] Teks hasil preprocessing ditampilkan di bawah hasil.

### `/tentang`
- [ ] Nama tim, NIM, dosen **Dr. Indra, S.Kom, M.T.I**, dan 7 titik genangan tampil.
- [ ] Daftar keterbatasan dan tautan sumber bisa dibaca.

### Lintas halaman
- [ ] Toggle tema terang/gelap bekerja dan tersimpan setelah reload.
- [ ] Di lebar **375 px** tidak ada scroll horizontal.
- [ ] `graph_ciledug.json` hanya dimuat di `/rute` (cek tab Network).
- [ ] Animasi berhenti bila OS disetel *reduce motion*.

---

## 9. Jalankan mode produksi

```bash
npm run build
npm run start
```

Buka **http://localhost:3000** (default port sama). Mode ini yang paling dekat dengan kondisi Vercel.

Untuk memastikan semua route merespons:

```bash
for p in / /klaster /rute /klasifikasi /tentang; do
  curl -s -o /dev/null -w "$p -> %{http_code}\n" "http://localhost:3000$p"
done
```

Semua harus `200`.

---

## 10. Regenerasi data (opsional, butuh Python)

Hanya dilakukan bila model/fixtures perlu dibuat ulang. Web **tidak** menjalankan Python.

```bash
# dari root repo
python3 -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/buat_fixtures_web.py
python scripts/kumpulkan_angka.py   # menulis laporan/angka.json
```

Setelah itu salin ulang angka bila berubah:

```bash
cp laporan/angka.json web/data/angka.json
cd web && npm test
```

Jika `buat_fixtures_web.py` gagal, **jangan lanjut** — berarti spesifikasi dan data tidak sinkron.

---

## 11. Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| `EADDRINUSE: port 3000` | Port dipakai proses lain | `lsof -ti:3000 \| xargs kill -9` lalu jalankan ulang |
| `window is not defined` | Leaflet dirender di server | Pastikan peta tetap dimuat via `dynamic(..., { ssr: false })` di client component |
| Peta abu-abu / tile kosong | Tidak ada internet atau OSM diblokir | Cek koneksi; tile butuh `tile.openstreetmap.org` |
| Banner “Data database tidak tersedia” | Env Supabase kosong/gagal | Normal tanpa Supabase. Bila sudah diisi: cek URL/key, schema `uts_ai_bencana`, RLS, dan status proyek tidak *Paused* |
| Metrik tidak berubah setelah isi env | Server belum restart | Hentikan `npm run dev`, jalankan lagi |
| Halaman `/rute` terasa berat saat dibuka | `graph_ciledug.json` ±1,8 MB | Normal; file hanya dimuat di halaman ini, tunggu indikator skeleton |
| Tes gagal setelah eksperimen | `public/model/` atau `fixtures/` berubah | Kembalikan lewat Git: `git checkout -- public/model fixtures` |
| Build gagal karena versi Node | Node terlalu lama | Upgrade ke Node 20.9+ (disarankan 22/24) |
| Peringatan hydration pada tema | Skrip tema berjalan sebelum React | Sudah ditangani `suppressHydrationWarning`; bukan error |
| `npm ci` gagal | Lockfile tidak sinkron | Pakai `npm install`, lalu commit `package-lock.json` bila berubah |

---

## 12. Checklist “sudah jalan”

- [ ] `npm ci` selesai tanpa error
- [ ] `npm test` → 130 lulus
- [ ] `npm run typecheck` dan `npm run lint` bersih
- [ ] `npm run build` sukses
- [ ] `npm run dev` terbuka di `http://localhost:3000`
- [ ] Kelima halaman lolos cek manual §8
- [ ] `public/model/` dan `fixtures/` tidak berubah (`git status`)
- [ ] (Opsional) Supabase terhubung dan banner fallback hilang
- [ ] (Opsional) Deploy Vercel dengan Root Directory `web`

---

## 13. Perintah harian

```bash
cd web
npm run dev        # ngoding
npm test           # sebelum commit
npm run build      # sebelum push/deploy
```

Referensi lain:

- Arsitektur & pembagian data: `docs/web/ARSITEKTUR.md`
- Kontrak data: `docs/web/KONTRAK-DATA.md`
- Port algoritma: `docs/web/ALGORITMA.md`
- Spesifikasi UI: `docs/web/UI.md`
- Deploy: `docs/web/SETUP-DEPLOY.md`
