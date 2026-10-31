# TODO — Proyek UTS Agen Tanggap Banjir Ciledug

Tanda: `[ ]` belum, `[x]` selesai. Bagian **KAMU** butuh akun, login, atau keputusanmu. Bagian **CLAUDE** dikerjakan Claude.

---

## A. Yang sudah selesai (CLAUDE)

- [X] Membuat folder proyek dan README
- [X] Mencari dataset: Mendeley "SRL Datasets for Crisis Event" (berbahasa Indonesia, berlabel banjir, CC BY 4.0)
- [X] Mengunduh dataset ke `data/raw/mendeley-srl-crisis/`
- [X] Memastikan label tingkat tweet bisa diturunkan: ~365 laporan banjir nyata vs ~880 bukan laporan

---

## B. KAMU — Identitas & konfirmasi ke dosen (±10 menit)

- [X] **B1.** Isi data untuk cover laporan di bawah ini:
  ```
  Nama            : Izvio Prijaya Mumin
  NIM             : 2611600087
  Prodi           : Magister Komputer
  Dosen pengampu  : Dr. Indra, S.Kom, M.T.I
  ```
- [ ] **B2.** Tanyakan ke dosen atau cek di grup kelas:
  1. Tanggal dan jam batas pengumpulan UTS
  2. Bobot NLP mengikuti struktur laporan (15%) atau rubrik (25%)? Keduanya berbeda di soal.
  3. Format presentasi: durasi berapa menit, offline atau online?
  4. Dikumpulkan di mana (e-learning, email, Google Drive)?

---

## C. KAMU — Akun yang perlu disiapkan (±20 menit)

Kalau sudah punya akunnya, cukup centang.

- [X] **C1. Google Drive.** Buat folder `UTS-AI-Banjir` di Google Drive. Folder ini dipakai Colab untuk menyimpan peta jalan supaya tidak perlu diunduh ulang.
- [X] **C2. GitHub.**
  1. Buka https://github.com/new
  2. Repository name: `uts-ai-banjir-ciledug`, pilih **Public** (dosen harus bisa membukanya)
  3. Klik **Create repository**, lalu kirim link-nya ke Claude
- [x] **C3. Vercel.** Buka https://vercel.com/signup, lalu pilih **Continue with GitHub**. Hubungkan akunnya saja, deploy-nya nanti.

---

## D. KAMU — Supabase (±15 menit)

- [x] **D1. Buat schema dan tabel.** ✅ Sudah dijalankan Claude lewat Supabase MCP (`supabase/schema.sql`). Langkah manual di bawah tidak perlu lagi:
  1. Buka https://supabase.com/dashboard, lalu pilih project **budiluhur-university**
  2. Menu kiri **SQL Editor**, lalu **New query**
  3. Salin seluruh isi `schema.sql`, tempel, lalu klik **Run**
  4. Pastikan muncul "Success. No rows returned"
- [x] **D2. Ekspos schema ke API**, supaya web Next.js bisa membaca data:
  1. **Project Settings** (ikon gerigi), lalu **Data API**
  2. Di **Exposed schemas**, tambahkan `uts_ai_bencana`, lalu **Save**
- [ ] **D3. Ambil connection string untuk Colab:**
  1. Klik tombol **Connect** di bagian atas dashboard
  2. Pilih tab **Session pooler**. **Jangan** pilih "Direct connection" karena Colab tidak mendukung IPv6.
  3. Salin URI-nya, bentuknya: `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-....pooler.supabase.com:5432/postgres`
  4. Ganti `[YOUR-PASSWORD]` dengan password database. Kalau lupa: **Project Settings → Database → Reset database password**. Hati-hati, 2 project lain yang memakai password lama ikut terdampak.
  5. **Jangan kirim password ke chat dan jangan ditulis di notebook.** Simpan di Colab: buka notebook, klik ikon kunci 🔑 (Secrets) di sidebar kiri, **Add new secret**, Name: `SUPABASE_DB_URL`, Value: URI tadi, lalu aktifkan toggle "Notebook access".
- [x] **D4. Ambil key untuk web:** ✅ Claude mengambilnya sendiri lewat MCP, jadi kamu tidak perlu mengirim apa pun.
- [ ] **D5. Sebelum presentasi:** buka dashboard Supabase sehari sebelumnya. Project gratis otomatis di-pause kalau 7 hari tidak aktif. Kalau statusnya "Paused", klik **Restore**.

---

## E. KAMU — Jurnal referensi (±15 menit)

Claude sudah mencari dan mengunduh **16 jurnal open access (2024–2026)** ke `referensi/`. Sitasi APA lengkap ada di [referensi/daftar-pustaka.md](referensi/daftar-pustaka.md).

**3 PDF gagal diunduh otomatis.** Situsnya memblokir bot (Cloudflare) atau sedang down. Cara mengunduh manual:

- [x] **E1. #01 Ariyanto dkk. (2025)**, paper dataset utama dan **wajib** ada.
  1. Buka https://pmc.ncbi.nlm.nih.gov/articles/PMC12164043/
  2. Klik tombol **PDF** di kanan atas (di HP: menu **⋯**)
  3. Simpan ke `referensi/` dengan nama `01-ariyanto-2025-dataset-srl-krisis.pdf`
- [x] **E2. #11 Sari dkk. (2024)**, diganti Claude dengan Gorat dkk. (2026), Naive Bayes untuk tweet banjir Sumatera. komparasi klasifikasi banjir dari Mercu Buana. Server jurnalnya error 404 saat dicek.
  1. Buka https://doi.org/10.22441/incomtech.v14i2.22962
  2. Kalau terbuka, klik **PDF**, lalu simpan sebagai `11-incomtech-2024-klasifikasi-ner-banjir.pdf`
  3. Kalau masih error, cari judulnya di https://scholar.google.com lalu klik link **[PDF]**. Kalau tetap tidak ada, lewati saja dan kabari Claude untuk mencari pengganti.
- [x] **E3. #15 Saraswati dkk. (2025)**, stemming dalam klasifikasi teks.
  1. Buka https://journal.universitasbumigora.ac.id/index.php/matrik/article/view/4833
  2. Tunggu verifikasi "Just a moment..." selesai, lalu klik **PDF** dan unduh
  3. Simpan sebagai `15-matrik-2025-stemming-necessity.pdf`
- [ ] **E4. Keputusan referensi klasik.** Tiga sumber asli metode berada di luar rentang 3 tahun: Russell & Norvig (2021, buku AI), Sharifi dkk. (2010, asal metode Hybrid TF-IDF yang diminta soal), Boeing (2017, OSMnx). Saran Claude: **tetap dicantumkan** sebagai rujukan metode, karena dosen umumnya mengizinkan sumber asli metode. Tanyakan ke dosen bersamaan dengan B2, lalu kabari Claude.

---

## F. KAMU (opsional, nilai plus) — Titik rawan banjir Ciledug

Ini dipakai untuk menandai jalan tergenang di peta A*. Kalau dilewati, Claude akan memakai titik dari berita yang bisa diverifikasi, dan sumbernya dicantumkan.

- [ ] **F1.** Cari di Google: `titik rawan banjir ciledug`, `banjir ciledug indah`, `banjir kali angke ciledug`, `BPBD kota tangerang titik rawan banjir`
- [ ] **F2.** Untuk tiap lokasi yang disebut di berita, catat di `data/raw/titik-banjir-ciledug.md`:
  ```
  - Nama lokasi: Perumahan Ciledug Indah
    Sumber: <link berita>
    Tanggal berita: 2025-01-xx
  ```
- [ ] **F3.** Target 5–10 lokasi. Koordinat tidak perlu, nanti dicari otomatis oleh Claude.

---

## G. CLAUDE — Pekerjaan berikutnya

- [x] G1. `supabase/schema.sql`: schema `uts_ai_bencana`, tabel, RLS read-only
- [x] G2. Notebook 1: EDA + preprocessing + label tingkat tweet
- [x] G3. Notebook 2: klasifikasi NB vs KNN vs DT, confusion matrix, metrik, tuning
- [ ] G4. Notebook 3: peta Ciledug, BFS vs DFS vs A*, rute menghindari genangan
- [ ] G5. Notebook 4: ekstraksi lokasi + ringkasan Hybrid TF-IDF
- [ ] G6. Ekspor model/graf ke JSON + simpan ke Supabase
- [ ] G7. Web Next.js: dashboard, klasifikasi langsung, animasi searching di peta, ringkasan
- [ ] G8. Deploy Vercel (butuh C2, C3, D4)
- [ ] G9. Flowchart & diagram arsitektur
- [ ] G10. Laporan .docx BAB I–IV (butuh B1 dan E)
- [ ] G11. Slide presentasi

---

## H. KAMU — Akhir (sebelum kumpul)

- [ ] H1. Baca seluruh laporan dan pastikan kamu paham tiap bagian. Soal menyebut plagiarisme tanpa pemahaman dikenai sanksi, dan presentasi pasti ada tanya-jawab.
- [ ] H2. Coba jalankan notebook di Colab dari awal sampai akhir (**Runtime → Run all**), pastikan tidak error
- [ ] H3. Buka link Vercel dari HP atau jaringan lain, pastikan bisa diakses
- [ ] H4. Kumpulkan: laporan .docx/PDF + link Colab/GitHub + link web
