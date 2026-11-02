# PRD — Web Demo "Agen Cerdas Peringkas Laporan Banjir"

| | |
|---|---|
| Proyek | UTS Kecerdasan Artifisial, Magister Ilmu Komputer, Universitas Budi Luhur |
| Tim | Izvio Prijaya Mumin (2611600087) — riset & notebook · Fatah Idzhar Hamdi (2611600129) — web |
| Tema dosen | Mesin Peringkasan & Klasterisasi (Tema D) |
| Status | Draf siap dibangun |

## 1. Latar belakang

Saat banjir, ribuan tweet muncul, tetapi sebagian besar opini, candaan, atau politik. Petugas tidak sempat membaca satu per satu.
Proyek ini membangun **agen cerdas** yang (1) mengenali tweet yang merupakan laporan kejadian, (2) mengelompokkan tweet per topik,
(3) meringkas tiap kelompok menjadi laporan situasi singkat, dan (4) mencari rute evakuasi yang menghindari genangan di Ciledug.
Semua riset sudah selesai di notebook Python. Web dibutuhkan untuk **presentasi UTS**: dosen bisa mencoba agen secara langsung lewat browser.

## 2. Tujuan & ukuran keberhasilan

| Tujuan | Ukuran |
|---|---|
| Dosen memahami alur agen dalam < 5 menit | Halaman Beranda menjelaskan alur dengan diagram dan angka kunci |
| Membuktikan model berjalan sungguhan, bukan gambar statis | Klasifikasi, peringkasan, dan pencarian rute dihitung **di browser** dan hasilnya identik dengan fixtures Python |
| Inti tema (klasterisasi & peringkasan) paling menonjol | Halaman Klaster & Ringkasan menjadi menu utama kedua setelah Beranda |
| Demo lancar saat presentasi | Halaman pertama tampil < 3 detik di koneksi 4G; animasi pencarian rute halus (≥ 30 fps) |

**Di luar cakupan:** login/akun, input data ke database, crawling Twitter langsung, melatih ulang model di web, mode offline.

## 3. Pengguna

| Pengguna | Kebutuhan |
|---|---|
| Dosen penguji | Melihat hasil, mencoba input sendiri, memeriksa kejujuran evaluasi |
| Izvio & Fatah (presenter) | Alur demo yang jelas dan stabil saat presentasi |
| Teman sekelas | Membuka link dari HP |

## 4. Fitur (prioritas)

**P0 = wajib untuk presentasi · P1 = sebaiknya ada · P2 = bonus**

| ID | Fitur | Prioritas | Kriteria diterima |
|---|---|---|---|
| F1 | **Beranda**: diagram alur agen, angka kunci (jumlah tweet, k klaster, F1 terbaik, A* vs UCS), link GitHub/Colab | P0 | Angka diambil dari data (bukan diketik manual) |
| F2 | **Klaster & Ringkasan**: daftar 11 klaster (kata kunci, jumlah, % laporan), ringkasan 3 tweet tiap klaster, sebaran 2D | P0 | Data dari `klaster_ringkasan.json`; klaster laporan tinggi tampil paling atas |
| F3 | **Ringkas teks sendiri**: tempel ≥ 5 tweet (satu per baris) → ringkasan Hybrid TF-IDF 3 tweet beserta skor | P0 | Lolos `web/fixtures/hybrid_tfidf.json` |
| F4 | **Rute Evakuasi**: peta Ciledug, titik banjir (BPBD) & tempat aman (OSM), pilih titik awal, skenario normal/banjir, hasil A* | P0 | Lolos `web/fixtures/searching.json` |
| F5 | **Animasi pencarian**: BFS/DFS/A* (dan UCS) menjelajah peta node demi node, bisa dibandingkan berdampingan | P0 | Urutan node yang di-expand identik dengan fixtures |
| F6 | **Klasifikasi**: tabel metrik NB/KNN/DT + confusion matrix dari Supabase; kotak uji "ketik tweet → laporan/bukan + probabilitas" | P1 | Lolos `web/fixtures/preprocessing_nb.json` |
| F7 | **Benchmark searching**: tabel/grafik rata-rata expanded & jarak per algoritma dari tabel `search_runs` | P1 | Data dari Supabase |
| F8 | **Evaluasi ROUGE**: tabel ROUGE Hybrid TF-IDF vs baseline dan kesepakatan antar-anotator | P1 | Menunggu notebook 4 dijalankan ulang setelah lembar acuan terisi; tampilkan "menunggu evaluasi" bila belum ada |
| F9 | **Tentang**: tim, dosen, dataset & sitasi, keterbatasan | P1 | Sitasi sesuai `referensi/daftar-pustaka.md` |
| F10 | Tema terang/gelap, tampilan rapi di HP | P1 | Lolos cek di lebar 375 px |
| F11 | Klik sembarang titik di peta sebagai titik awal | P2 | Titik di-snap ke node terdekat |

## 5. Alur demo presentasi (± 5 menit)

1. Beranda → jelaskan masalah dan alur agen.
2. Klaster & Ringkasan → tunjukkan klaster dengan % laporan tertinggi (paling atas di halaman) dan ringkasannya, lalu bandingkan dengan klaster politik.
3. Tempel beberapa tweet → ringkasan langsung muncul (F3).
4. Rute Evakuasi → pilih "Jalan Raden Saleh Raya", toggle banjir → rute berubah dari 0,23 km menjadi 1,73 km; jalankan animasi BFS vs DFS vs A*.
5. Klasifikasi → ketik tweet sendiri (F6).

## 6. Persyaratan non-fungsional

- **Performa**: `graph_ciledug.json` (±1,9 MB) dimuat hanya di halaman Rute (lazy). Pencarian A* < 100 ms di laptop.
- **Keamanan**: hanya publishable key di klien; tanpa secret di repo; tidak ada input yang dikirim ke server.
- **Aksesibilitas**: kontras warna cukup, semua kontrol bisa dipakai dengan keyboard, peta punya ringkasan teks hasil rute.
- **Kejujuran data**: angka yang tampil harus berasal dari file/database, bukan ditulis tangan. Cantumkan keterbatasan (lihat F9).

## 7. Risiko

| Risiko | Mitigasi |
|---|---|
| Stemming JS berbeda dengan Python Sastrawi | Pakai `stem_lookup.json` (hasil Python) terlebih dulu; `sastrawijs` hanya untuk kata baru |
| Supabase free di-pause setelah 7 hari tidak aktif | Halaman tetap jalan dengan data JSON; tampilkan pesan bila Supabase tidak terjangkau; buka dashboard sehari sebelum presentasi |
| Ribuan garis jalan berat di Leaflet | Render dengan canvas (`preferCanvas`) dan satu layer polyline |
| Konflik gaya daisyUI dengan animate-ui (berbasis shadcn) | daisyUI untuk tema & komponen dasar; animate-ui/motion hanya untuk animasi tertentu (lihat ARSITEKTUR.md) |
