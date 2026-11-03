# Spesifikasi UI

Bahasa antarmuka: **Indonesia**. Tema daisyUI: satu tema terang dan satu tema gelap (mis. `light` / `dark` atau `corporate` / `business`),
dengan tombol ganti tema di navbar. Lebar minimum yang harus rapi: 375 px.

## Navigasi

`Beranda · Klaster & Ringkasan · Rute Evakuasi · Klasifikasi · Tentang`. Di HP: drawer daisyUI.

---

## 1. Beranda `/` (F1)

| Bagian | Isi | Komponen |
|---|---|---|
| Hero | Judul proyek, satu kalimat masalah, nama tim & dosen | `hero` daisyUI, judul masuk dengan motion `fade-up` |
| Alur agen | 4 langkah berurutan: *Klasifikasi → Klasterisasi → Peringkasan → Rute*, tiap langkah link ke halamannya | `steps` daisyUI atau kartu horizontal; muncul bertahap (stagger) |
| Angka kunci | Jumlah tweet dianalisis (3.390), k klaster (11), F1 Naive Bayes, rasio node A* : UCS | `stats` daisyUI; angka berjalan (count-up) dengan motion |
| Link | GitHub repo, Colab notebook 1–4 | tombol |

Semua angka dari data (lihat ARSITEKTUR.md §4), bukan diketik manual.

---

## 2. Klaster & Ringkasan `/klaster` (F2, F3, F8) — halaman inti

**Bagian A — Peta klaster**
- Scatter SVG dari `titik` (1.500 titik), warna per klaster, legenda yang bisa diklik untuk menyorot satu klaster.
- Teks kecil: "proyeksi 2D dari 100 dimensi LSA; jarak antartitik hanya perkiraan".

**Bagian B — Daftar klaster** (urut sesuai file: % laporan tertinggi di atas)
- Kartu per klaster: `Klaster {id}`, badge jumlah tweet, **progress bar % laporan**, chip kata kunci.
- Badge `sumber`: "diringkas dari tweet laporan" atau "diringkas dari semua tweet".
- Isi kartu: 3 tweet ringkasan (URL dihapus), tanggal, dan skor Hybrid TF-IDF kecil di pojok.
- Kartu dengan % laporan ≥ 30 diberi aksen warna "laporan".

**Bagian C — Coba ringkas sendiri (F3)**
- `textarea` (satu tweet per baris) dengan placeholder contoh; tombol **Ringkas**; tombol **Isi contoh** (ambil 10 tweet dari salah satu set).
- Validasi: minimal 5 baris tidak kosong; pesan error di bawah textarea.
- Hasil: 3 baris terpilih disorot di daftar input, dan tabel skor semua baris (bisa diurutkan).

**Bagian D — Evaluasi ROUGE (F8)**
- Tabel `metode × ROUGE-1/2/L`, kesepakatan antar-anotator, dan uji Wilcoxon.
- Tampilkan `alert-warning`: Hybrid TF-IDF lebih tinggi dari TF-IDF standar pada ROUGE-1/RL, tetapi
  **belum signifikan** (p > 0,05) dan setara dengan pemilihan acak. Angka dari `laporan/angka.json`.

---

## 3. Rute Evakuasi `/rute` (F4, F5, F7)

Tata letak desktop: peta di kiri (±65%), panel kontrol di kanan. HP: peta di atas, panel di bawah.

**Panel kontrol**
1. **Titik awal**: `select` berisi 7 titik banjir (`flood_points`), default "Jalan Raden Saleh Raya, Karang Mulya". (P2: klik peta.)
2. **Skenario**: toggle *Normal* / *Banjir (hindari genangan)*.
3. **Algoritma**: radio `A*` (default), `UCS`, `BFS`, `DFS`, atau **Bandingkan semua**.
4. Tombol **Cari rute** dan **Putar animasi** (kecepatan: lambat / sedang / cepat; tombol jeda & ulang).

**Peta (Leaflet, canvas renderer)**
- Layer jalan: semua `edges` abu tipis; ruas tergenang (`f = 1`) biru tebal **hanya** saat skenario Banjir.
- Lingkaran radius titik banjir (biru transparan) + marker; popup: nama & link sumber berita.
- Marker tempat aman (ikon hijau) dengan popup nama & jenis.
- Rute hasil (`path`) langsung digambar merah tebal; saat animasi diputar, node di `jejak` muncul bertahap sebagai titik oranye di atasnya.
- Peta otomatis `fitBounds` ke rute (atau `setView` ke titik awal) supaya jalur tidak keluar layar.
- Mode **Bandingkan semua**: 4 peta kecil berdampingan (2×2), animasi berjalan bersamaan dengan kecepatan sama.
- Atribusi wajib: "© OpenStreetMap contributors".

**Hasil (di bawah panel)**
- `stats`: tujuan (nama tempat aman), jarak (km), biaya, node di-expand, jumlah langkah.
- Kalimat ringkas yang bisa dibaca screen reader, mis. "A* menemukan Klinik Budhi Medika sejauh 1,73 km setelah memeriksa 109 persimpangan."
- Bila skenario Banjir: bandingkan dengan Normal ("rute memutar +1,50 km untuk menghindari genangan").

**Benchmark (F7)**: tabel rata-rata `nodes_expanded` & `path_length_m` per algoritma dan skenario dari `search_runs`, plus bar chart sederhana.

---

## 4. Klasifikasi `/klasifikasi` (F6)

- Tabel metrik 3 model (`model_metrics`), baris Naive Bayes diberi label "model terpilih (F1 cross-validation tertinggi)".
- 3 confusion matrix kecil (grid 2×2 dengan warna intensitas).
- **Kotak uji**: input satu tweet → badge `Laporan` / `Bukan laporan`, bar probabilitas, dan teks hasil preprocessing
  (untuk menunjukkan tahapan). Sediakan 3 tombol contoh tweet.
- Catatan jujur: "F1 0,61 — model masih sering salah pada tweet kiasan atau tidak lengkap."

---

## 5. Tentang `/tentang` (F9)

- Tim (nama, NIM), dosen, mata kuliah, universitas, logo BLU (`laporan/assets/Emblem_of_Budi_Luhur_University.png`, salin ke `web/public/`).
- Dataset & sitasi (Ariyanto dkk., 2025; OpenStreetMap; berita BPBD dari `flood_points.source_url`).
- **Keterbatasan** (wajib, sesuai laporan): label dataset per token diturunkan ke tingkat tweet; korpus hasil sampling (maks. ±14 tweet/hari);
  silhouette klaster < 0,1 (batas topik tidak tegas); penalti genangan ×20 dan radius 150–300 m adalah asumsi; 2 titik BPBD tidak
  ditemukan di OSM; sebagian tweet dari luar Jabodetabek lolos penyaringan.

---

## Perilaku umum

| Keadaan | Tampilan |
|---|---|
| Memuat JSON/Supabase | `skeleton` daisyUI |
| Supabase gagal | `alert-warning` kecil: "Data database tidak tersedia, menampilkan data lokal." Halaman tetap jalan |
| Graf belum termuat | Tombol Cari rute nonaktif + spinner |
| Animasi | Hormati `prefers-reduced-motion`: lewati animasi dan langsung tampilkan hasil |

Aksesibilitas: semua tombol punya label teks; kontras teks ≥ 4.5:1; urutan fokus keyboard logis; warna klaster tidak menjadi satu-satunya pembeda (sertakan nomor klaster).
