# Dokumentasi Web — Agen Cerdas Peringkas Laporan Banjir

Panduan untuk membangun web demo proyek UTS Kecerdasan Artifisial (Izvio & Fatah). Semua riset (data, model, hasil)
sudah selesai di notebook Python; **web hanya menampilkan hasil dan menjalankan ulang model di browser**.

## Urutan baca

| # | Dokumen | Isi | Kapan dibaca |
|---|---|---|---|
| 1 | [PRD.md](PRD.md) | Tujuan, pengguna, fitur, kriteria selesai | Pertama, untuk paham *apa* yang dibuat |
| 2 | [ARSITEKTUR.md](ARSITEKTUR.md) | Stack, struktur folder, alur data | Sebelum mulai coding |
| 3 | [SETUP-DEPLOY.md](SETUP-DEPLOY.md) | Instalasi, env, menjalankan lokal, deploy Vercel | Saat setup |
| 4 | [KONTRAK-DATA.md](KONTRAK-DATA.md) | Format semua file JSON dan tabel Supabase | Saat mengambil data |
| 5 | [ALGORITMA.md](ALGORITMA.md) | Spesifikasi port ke TypeScript (preprocessing, Naive Bayes, BFS/DFS/UCS/A*, Hybrid TF-IDF) | Saat mengimplementasi `lib/` |
| 6 | [UI.md](UI.md) | Halaman, komponen, perilaku, aksesibilitas | Saat membangun tampilan |

## Prinsip penting

1. **Jangan mengubah file di `web/public/model/` dan `web/fixtures/`.** File-file ini dihasilkan notebook dan skrip
   `scripts/buat_fixtures_web.py`. Jika perlu berubah, minta Izvio menjalankan ulang notebook atau skripnya.
2. **Hasil TypeScript harus identik dengan Python.** Setiap algoritma di `lib/` wajib lolos uji terhadap `web/fixtures/*.json`
   (lihat ALGORITMA.md). Inilah bukti di laporan bahwa web menjalankan model yang sama dengan penelitian.
3. **Web hanya membaca.** Supabase diakses dengan *publishable key* yang hanya bisa `SELECT` (RLS). Tidak ada form yang menulis ke database.

## Ringkasan proyek (untuk konteks)

```
Tweet banjir ──► Preprocessing (Sastrawi) ──► Naive Bayes: laporan / bukan          [BAB III]
                                   │
                                   └──► TF-IDF + LSA ──► K-Means (k=11) ──► Hybrid TF-IDF per klaster   [BAB IV — inti]
Lokasi laporan (Ciledug) ──► BFS / DFS / UCS / A* di peta jalan OSM, hindari genangan                [BAB II]
```
