# Panduan Proyek: Agen Cerdas Tanggap Banjir

Dokumen ini menjelaskan proyek UTS Kecerdasan Artifisial kami untuk pembaca tanpa latar belakang AI: apa yang dikerjakan,
data apa yang dipakai dan di mana letaknya, bagaimana alurnya, dan seberapa baik hasilnya.

Kelompok: Izvio Prijaya Mumin (2611600087) dan Fatah Idzhar Hamdi (2611600129). Magister Ilmu Komputer, Universitas Budi Luhur.
Dosen: Dr. Indra, S.Kom, M.T.I. Tema: **Mesin Peringkasan & Klasterisasi**.

---

## 1. Masalah yang ingin diselesaikan

Saat banjir, Twitter/X dibanjiri ribuan unggahan. Sebagian berisi laporan yang berguna ("Jalan Raden Saleh sudah tergenang
50 cm"), tetapi lebih banyak lagi yang berisi opini, debat politik, candaan, atau doa. Petugas tidak sempat membaca semuanya.

Proyek ini membuat sebuah **agen cerdas**, yaitu program yang menerima tweet dan bertindak sendiri:

1. **Menyaring**: memisahkan laporan kejadian banjir dari tweet lain.
2. **Mengelompokkan**: menyatukan tweet yang membahas hal serupa, misalnya banjir Tangerang, banjir Bekasi, atau debat gubernur.
3. **Meringkas**: memilih 3 tweet yang paling mewakili tiap kelompok, sehingga petugas cukup membaca 3 tweet, bukan ratusan.
4. **Menindaklanjuti**: mencari rute evakuasi di Ciledug dari titik banjir ke tempat aman terdekat sambil menghindari jalan
   yang tergenang. Titik awalnya dipilih dari 7 titik genangan hasil pemberitaan, atau diklik langsung di peta.

Ciledug dipilih karena salah satu anggota kelompok tinggal di sana dan daerah ini memang rawan banjir (dilalui Kali Angke).

## 2. Gambaran alur

```
 Tweet banjir ──► [1] Bersihkan teks ──► [2] Laporan atau bukan? ──► [3] Kelompokkan ──► [4] Ringkas
 (dataset)          (Notebook 1)            (Notebook 2)                (Notebook 4)       (Notebook 4)
                                                                                              │
 Peta jalan Ciledug ───────────────────────────► [5] Cari rute evakuasi ◄─────────────────────┘
 (OpenStreetMap)                                    (Notebook 3)
                                                         │
                                  Hasil disimpan ke Supabase (database) dan file JSON
                                                         │
                                        Ditampilkan di aplikasi web (Next.js)
```

Diagram yang lebih rapi ada di `laporan/gambar/00_flowchart.png` dan `laporan/gambar/00_arsitektur.png`.

## 3. Data yang dipakai dan letaknya

### 3.1 Tweet banjir (data utama)

- **Sumber**: *Semantic Role Labeling Datasets for Crisis Event*, Mendeley Data versi 2, lisensi CC BY 4.0, terbuka untuk umum.
  DOI [10.17632/r76v5sjyv2.2](https://data.mendeley.com/datasets/r76v5sjyv2/2). Dataset ini dipublikasikan di jurnal
  Ariyanto dkk. (2025), *Data in Brief*, 61, 111688.
- **Lokasi di repo**: `data/raw/mendeley-srl-crisis/`. Folder `raw` berisi file asli dan tidak pernah diubah.

| File | Isi | Dipakai untuk |
|---|---|---|
| `all-labeled-data-with-english-translation.csv` | 4.150 tweet bencana yang sudah diberi tanda oleh peneliti; 1.250 di antaranya tentang banjir | Mengajari komputer membedakan laporan vs bukan laporan |
| `flood-with-english-translation.csv` | 43.028 tweet banjir tahun 2018–2023, tanpa tanda | Dikelompokkan dan diringkas |

**Soal label.** Peneliti asli memberi tanda per kata, bukan per tweet. Kami mengubahnya menjadi label per tweet: kalau tweet
memuat kata bertanda `FLOOD-EVENT` (kejadian banjir nyata), tweet itu dianggap **laporan**; kalau tidak, **bukan laporan**.
Setelah 30 tweet berbahasa Melayu (banjir Malaysia) dibuang, tersisa **1.220 tweet**: 368 laporan dan 852 bukan laporan.

### 3.2 Peta jalan Ciledug

- **Sumber**: OpenStreetMap, peta dunia terbuka yang dibuat relawan, diambil dengan pustaka OSMnx.
- **Cakupan**: radius 4,5 km dari pusat Ciledug, berisi **19.066 persimpangan** dan **43.689 ruas jalan**.
- **Tempat aman**: 65 lokasi berupa rumah sakit, klinik, pos pemadam kebakaran, kantor polisi, dan kantor pemerintahan, yang
  juga diambil dari OpenStreetMap.
- **Titik banjir**: 7 lokasi genangan yang pernah diberitakan media/BPBD, antara lain Perumahan Ciledug Indah, Kreo, dan
  Jalan Raden Saleh Raya. Ruas jalan di sekitarnya (717 ruas) ditandai tergenang.
- **Lokasi di repo**: `web/public/model/graph_ciledug.json`. Data mentah unduhan OSMnx disimpan di folder `cache/`.

### 3.3 Ringkasan acuan buatan manusia

Untuk menilai mesin peringkas, perlu ringkasan pembanding yang ditulis manusia. Kami mengambil 10 kumpulan berisi 25 tweet,
lalu **masing-masing anggota menulis ringkasannya sendiri tanpa bantuan AI**.

- `data/reference/set_evaluasi.json`: 10 kumpulan tweet yang diringkas. Isinya dikunci dan tidak berubah.
- `data/reference/lembar_acuan_izvio.md` dan `lembar_acuan_fatah.md`: ringkasan tulisan tangan kami berdua.

### 3.4 Data hasil olahan dan cara membuatnya

Semua file di bawah dibuat otomatis oleh notebook dari data mentah, tanpa diedit manual. Kalau notebook dijalankan ulang,
file-file ini terbentuk lagi dengan isi yang sama.

#### a. `data/processed/tweets_banjir.json`: data untuk belajar klasifikasi

Dibuat oleh **Notebook 1** dari `all-labeled-data-with-english-translation.csv`.

```
4.150 tweet bencana (banjir, kebakaran, gempa, kecelakaan)
   │  ambil hanya tweet banjir
   ▼
1.250 tweet banjir
   │  buang tweet berbahasa Melayu (banjir Malaysia)
   ▼
1.220 tweet  ──► diberi label, dibersihkan, dibagi latih/uji
```

1. **Pilih tweet banjir.** Di file asli, satu baris berisi satu *kata*, bukan satu tweet. Setiap kata punya kode tweet
   (misalnya `BAN-00010`), sehingga baris-baris dengan kode yang sama digabung kembali menjadi satu tweet utuh, dan hanya
   kode berawalan `BAN` (banjir) yang diambil.
2. **Beri label.** Peneliti asli menandai kata pemicu kejadian. Kalau tweet memuat minimal satu kata bertanda `FLOOD-EVENT`,
   labelnya **laporan**; kalau tidak, labelnya **bukan_laporan**.
3. **Ambil lokasi.** Kata yang ditandai peneliti sebagai nama tempat (`LOC`) atau nama jalan (`STREET-ARG`) dirangkai
   menjadi frasa, misalnya "dki jakarta" atau "jalan pagarsih", lalu disimpan di kolom `locations`. Kolom ini dipakai untuk
   eksplorasi data dan ikut tersimpan di Supabase, tetapi **belum** dipakai untuk menentukan titik awal rute.
4. **Buang tweet Melayu.** Tweet yang memuat kata khas Melayu ("kerana", "sahaja", "bomba") atau nama daerah Malaysia
   ("Johor", "Kelantan", "Selangor") dibuang. Ada 30 tweet.
5. **Bersihkan teks** dengan langkah yang dijelaskan di bagian 4 (Langkah 1). Hasilnya disimpan di kolom `text_clean`.
6. **Bagi 80:20.** Sebanyak 976 tweet menjadi data latih dan 244 tweet menjadi data uji. Pembagiannya dibuat sedemikian rupa
   sehingga proporsi laporan di kedua bagian sama (sekitar 30%). Pengacakan memakai angka tetap (`random_state=42`), sehingga
   pembagiannya selalu sama.

Kolom di file: `id`, `text_raw` (tweet asli), `text_clean` (tweet bersih), `label`, `split` (`train`/`test`), `locations`.

#### b. `data/processed/model_metrics.json`: rapor tiga algoritma

Dibuat oleh **Notebook 2**. Ketiga algoritma (Naive Bayes, KNN, Decision Tree) dilatih dengan data `train` dari file (a),
lalu diuji dengan data `test`. Setiap algoritma dicatat akurasinya, presisi, recall, F1, nilai F1 uji silang, tabel benar/salah
(*confusion matrix*), pengaturan terbaik, dan lama pelatihannya. Model Naive Bayes yang terpilih juga diekspor ke
`web/public/model/naive_bayes.json` agar bisa dipakai web dan Notebook 4.

#### c. `data/processed/korpus_jabodetabek.json`: tweet yang dikelompokkan

Dibuat oleh **Notebook 4** dari `flood-with-english-translation.csv`.

```
43.028 baris di file CSV
   │  buang 5 baris yang tanggalnya tidak terbaca
   ▼
43.023 tweet
   │  buang 5 baris yang teksnya kosong
   ▼
43.018 tweet
   │  ambil yang menyebut wilayah Jabodetabek
   ▼
 3.491 tweet
   │  buang tweet berbahasa Melayu atau Inggris
   ▼
 3.444 tweet
   │  bersihkan teks, buang duplikat, buang yang tinggal < 3 kata
   ▼
 3.390 tweet  ──► dikelompokkan dan diringkas
```

1. **Saring wilayah.** Tweet diambil kalau menyebut salah satu kata: jakarta, tangerang, ciledug, bekasi, depok, bogor,
   jabodetabek, dki, kali angke, atau ciliwung.
2. **Buang bahasa lain.** Tweet Melayu dibuang dengan cara yang sama seperti di (a). Tweet yang memuat 2 atau lebih kata umum
   bahasa Inggris (the, and, is, …) juga dibuang.
3. **Bersihkan teks** dengan modul yang sama seperti di (a) (`notebooks/teks.py`), sehingga semua notebook dan web
   memperlakukan teks dengan cara yang persis sama.
4. **Buang duplikat.** Retweet dan tweet yang isinya sama setelah dibersihkan cukup disimpan satu.
5. **Buang tweet terlalu pendek.** Tweet yang setelah dibersihkan tinggal kurang dari 3 kata tidak cukup bermakna untuk
   dikelompokkan.

Kolom di file: `waktu` (tanggal tweet), `text_raw`, `text_clean`.

#### d. `data/reference/label_klaster_acuan.json`: kunci jawaban kelompok

Dibuat oleh **Notebook 4** saat pertama kali dijalankan di laptop. Isinya nomor kelompok (0–10) untuk masing-masing dari
3.390 tweet di file (c), ditambah "sidik jari" (*hash*) data teks dan data angkanya. Saat notebook dijalankan di komputer
lain, misalnya Google Colab, hasilnya dibandingkan dengan file ini:

- Sidik jari teks sama → pembersihan teks menghasilkan data yang identik.
- Sidik jari angka sama → pengubahan tweet menjadi angka menghasilkan data yang identik.
- ARI = 1,0 → setiap tweet masuk ke kelompok yang sama.

#### e. `data/reference/set_evaluasi.json`: soal ujian untuk peringkas

Dibuat oleh **Notebook 4**. Dari kelompok-kelompok yang terbentuk, diambil 10 kumpulan berisi 25 tweet secara acak (dengan
angka acak tetap). Kelompok besar bisa mendapat 2 kumpulan. Setelah dibuat pertama kali, file ini **dikunci**: notebook
hanya membacanya dan tidak membuatnya ulang, karena ringkasan acuan buatan manusia (bagian 3.3) ditulis berdasarkan isi
kumpulan ini.

## 4. Langkah demi langkah

Seluruh pekerjaan ada di empat *notebook*, yaitu file berisi kode Python beserta penjelasan dan hasilnya. Notebook ada di
folder `notebooks/` dan bisa dibuka di Google Colab.

### Langkah 1: Membersihkan teks (`01_eda_preprocessing`)

Tweet berisi banyak hal yang mengganggu komputer: link, mention, singkatan gaul, dan imbuhan. Teks dirapikan dengan cara:

- Semua huruf dijadikan kecil; link dan mention dihapus.
- Kata gaul dinormalkan ("gk" menjadi "tidak", "bgt" menjadi "banget").
- Angka diganti kata `angka`. Tinggi air "50 cm" atau "1 meter" penting, tetapi nilai persisnya tidak.
- Kata umum yang tidak bermakna ("yang", "di", "dan") dibuang, kecuali kata penting seperti "tidak".
- Kata dikembalikan ke bentuk dasar dengan pustaka Sastrawi ("terendam" menjadi "rendam").
- Tweet berbahasa Melayu dibuang.

Contoh: *"Banjir di Perumahan Ciledug Indah udah 50cm gk bisa lewat"* menjadi *"banjir rumah ciledug indah sudah angka sentimeter tidak lewat"*.

### Langkah 2: Laporan atau bukan? (`02_klasifikasi`)

Komputer diajari dari 976 contoh tweet berlabel (data latih), lalu diuji pada 244 tweet yang belum pernah dilihatnya (data
uji). Tiga cara dibandingkan:

| Algoritma | Cara kerjanya | F1 data uji |
|---|---|---|
| **Naive Bayes** | Menghitung peluang: kata seperti "rendam" dan "genang" sering muncul di laporan, kata seperti "gubernur" jarang | **0,61** (terpilih) |
| KNN | Mencari 7 tweet berlabel yang paling mirip, lalu ikut suara terbanyak | 0,57 |
| Decision Tree | Membuat pohon pertanyaan ya/tidak ("ada kata 'rendam'?") | 0,52 |

**F1** adalah skor 0–1 yang menggabungkan dua hal: seberapa banyak laporan asli yang tertangkap, dan seberapa sering tebakan
"laporan" itu benar. Naive Bayes dipilih berdasarkan uji silang (*cross-validation*) pada data latih, bukan berdasarkan data
uji, supaya pemilihannya adil. Hasilnya, dari 74 laporan di data uji, 45 tertangkap.

### Langkah 3: Mencari rute evakuasi (`03_searching_rute`)

Peta jalan dianggap sebagai jaringan: persimpangan adalah titik, ruas jalan adalah garis yang punya panjang. Ruas yang
tergenang diberi "biaya" **20 kali lipat** panjangnya, sehingga rute lewat jalan banjir hanya dipilih kalau benar-benar
tidak ada jalan lain. Empat cara pencarian dibandingkan:

| Algoritma | Cara kerjanya | Selalu rute terpendek? | Persimpangan yang diperiksa |
|---|---|---|---|
| BFS | Menyebar rata ke segala arah, menghitung jumlah belokan | Tidak (2%) | ~9.556 |
| DFS | Menyusuri satu jalan sampai mentok, lalu mundur | Tidak (0%), rutenya bisa 40× lebih panjang | ~9.137 |
| UCS | Selalu memperluas dari titik dengan jarak tempuh terkecil | Ya (100%) | ~8.748 |
| **A\*** | Seperti UCS, ditambah perkiraan jarak lurus ke tujuan sebagai "kompas" | **Ya (100%)** | **~2.547** |

A\* menemukan rute terpendek yang sama dengan UCS, tetapi hanya memeriksa sekitar 3,4 kali lebih sedikit persimpangan.
Menghindari genangan rata-rata menambah jarak 324 meter.

### Langkah 4: Mengelompokkan tweet (`04_klasterisasi_peringkasan`, bagian 1–5)

Dari 43.028 tweet banjir (43.018 setelah baris tanpa tanggal atau teks dibuang), diambil yang menyebut wilayah Jabodetabek, lalu dibersihkan dan dibuang duplikatnya. Hasilnya
**3.390 tweet**. Naive Bayes dari langkah 2 menandai 539 di antaranya sebagai laporan.

Cara mengelompokkan:

1. **Tweet diubah menjadi angka** (TF-IDF): setiap kata diberi bobot; kata yang khas untuk tweet itu bobotnya tinggi.
2. **Diringkas menjadi 100 "topik tersembunyi"** (LSA), sehingga tweet yang memakai kata berbeda tetapi bermakna mirip bisa
   saling berdekatan.
3. **Dikelompokkan dengan K-Means**: komputer mencari *k* titik pusat dan setiap tweet masuk ke kelompok pusat terdekat.
   K-Means dibandingkan dengan Agglomerative Clustering dan unggul pada semua nilai *k*.
4. **Jumlah kelompok** ditentukan dengan metode siku (*elbow*): kelompok terus ditambah sampai penambahannya tidak lagi
   membuat kelompok jauh lebih rapi. Hasilnya **11 kelompok**.

Contoh kelompok yang terbentuk:

| Kelompok | Jumlah tweet | % laporan | Isi |
|---|---|---|---|
| Banjir Tangerang | 140 | 75,7% | Kawasan industri dan perumahan tergenang |
| Banjir Bekasi | 177 | 35,0% | Laporan kelurahan dan data BPBD Bekasi |
| Banjir Jakarta | 562 | 31,3% | RT terendam, pengungsi |
| Sungai Ciliwung | 217 | 11,5% | Kali meluap, Bendung Katulampa siaga |
| Politik gubernur | 343 | 0,6% | Debat penanganan banjir |
| Bendungan Ciawi–Sukamahi | 52 | 0,0% | Berita pembangunan bendungan |

Kelompok dengan persentase laporan tinggi adalah kelompok yang paling perlu dibaca petugas.

### Langkah 5: Meringkas (`04_klasterisasi_peringkasan`, bagian 6–7)

Untuk setiap kelompok, komputer memilih **3 tweet paling mewakili** dengan metode **Hybrid TF-IDF** (Sharifi dkk., 2010):

- Setiap kata diberi skor: tinggi kalau sering muncul di kelompok itu tetapi tidak muncul di semua tweet.
- Skor tweet adalah jumlah skor katanya, dibagi panjang tweet (dengan batas bawah 11 kata, supaya tweet yang sangat pendek
  tidak menang hanya karena singkat), sehingga tweet panjang juga tidak selalu menang.
- Tweet berskor tertinggi dipilih, tetapi tweet yang terlalu mirip dengan yang sudah terpilih dilewati supaya ringkasan tidak
  berulang.
- Kalau kelompok punya minimal 10 laporan, yang diringkas hanya tweet laporannya.

**Penilaian.** Ringkasan mesin dibandingkan dengan ringkasan tulisan kami memakai **ROUGE**, yaitu persentase kata yang sama
antara ringkasan mesin dan ringkasan manusia.

| Metode | ROUGE-1 |
|---|---|
| Hybrid TF-IDF (metode kami) | 0,176 |
| Pilih 3 tweet acak | 0,174 |
| TF-IDF standar | 0,149 |
| Kesamaan ringkasan Izvio vs Fatah | 0,298 |

## 5. Hasil disimpan dan ditampilkan di mana

- **Supabase** (database PostgreSQL gratis), schema `uts_ai_bencana`. Tabelnya: `tweets`, `predictions`, `model_metrics`,
  `summaries`, `safe_places`, `flood_points`, dan `search_runs`. Struktur tabel ada di `supabase/schema.sql`. Yang boleh
  menulis ke database hanya notebook; aplikasi web hanya bisa membaca.
- **File JSON untuk web** di `web/public/model/`: model Naive Bayes, peta Ciledug, hasil kelompok dan ringkasan, serta aturan
  pembersihan teks. Aplikasi web menjalankan klasifikasi dan pencarian rute langsung di browser memakai file ini.
- **Aplikasi web** (Next.js, di-deploy ke Vercel), dikerjakan Fatah. Panduannya ada di `docs/web/` dan `web/PANDUAN.md`.
  Rinciannya di bagian 5A.
- **Laporan UTS** di `laporan/` (format .docx dan .pdf). Semua angka di laporan diambil otomatis dari hasil notebook, jadi
  tidak ada angka yang diketik manual.

## 5A. Aplikasi web: apa yang bisa dicoba

Web hanya menampilkan hasil riset dan menjalankan ulang modelnya di browser. Tidak ada server Python dan tidak ada data
yang dikirim keluar. Lima halamannya:

| Halaman | Input | Output |
|---|---|---|
| Beranda | (tidak ada) | Angka kunci dari hasil riset: 3.390 tweet dianalisis, 1.220 berlabel, 11 klaster, F1 Naive Bayes 0,61, A\* vs UCS 4,1× |
| Klaster & Ringkasan | Pilih klaster, atau tempel minimal 5 tweet (satu per baris) | Sebaran 1.500 titik, 11 kartu klaster dengan 3 tweet ringkasan, tabel ROUGE; untuk tweet tempelan: 3 tweet terpilih beserta skor Hybrid TF-IDF |
| Rute Evakuasi | Titik awal (7 titik banjir atau klik peta), skenario normal/banjir, algoritma A\*/UCS/BFS/DFS atau "Bandingkan semua" | Jalur di peta, jarak, biaya, jumlah persimpangan diperiksa, animasi penjelajahan, tabel benchmark |
| Klasifikasi | Satu tweet | Label laporan/bukan laporan, probabilitas, dan teks hasil pembersihan; ditambah tabel metrik dan confusion matrix tiga model |
| Tentang | (tidak ada) | Tim, dataset, sitasi, dan keterbatasan |

**Menjalankan di komputer sendiri** (perlu Node.js):

```
cd web
npm ci
npm run dev                  # pengembangan, http://localhost:3000
npm run build && npm start   # versi produksi, lebih cepat; pakai ini untuk menilai kecepatan
npm test                     # 130 uji: hasil TypeScript harus sama dengan hasil Python
```

**Tanpa Supabase.** Supabase hanya melengkapi tabel metrik dan benchmark. Kalau kunci Supabase tidak diisi atau
database tidak terjangkau, web memakai `web/data/angka.json` (salinan `laporan/angka.json` yang dibuat otomatis oleh
`scripts/kumpulkan_angka.py`) dan menampilkan banner kecil. Model, klaster, dan peta tetap lengkap karena dibaca dari
`web/public/model/*.json`. Peta memakai tile OpenStreetMap, dan peta jalan Ciledug (±1,9 MB) hanya diunduh saat halaman
Rute dibuka.

## 6. Bagaimana memastikan hasilnya bisa diulang

Hasil pengelompokan sangat peka. Kami menemukan bahwa selisih pembulatan angka yang sangat kecil antara laptop dan server
Google Colab bisa membuat K-Means menghasilkan kelompok berbeda. Solusinya:

1. Versi pustaka Python dikunci di `requirements.txt`. Notebook 4 memasangnya sendiri di Colab.
2. Perhitungan dibatasi satu *thread* CPU.
3. K-Means memulai dari titik pusat hasil Agglomerative Clustering, yang tidak memakai angka acak.

Buktinya, Colab dan laptop menghasilkan kelompok yang identik untuk setiap tweet (ARI = 1,0). Notebook 1–4 juga sudah
dijalankan ulang dengan versi pustaka yang berbeda untuk memeriksa hal ini: data latih, model Naive Bayes,
11 klaster beserta ringkasannya, dan peta jalan tetap sama (peta hanya berbeda pada pembulatan digit terakhir koordinat
dan panjang ruas). Yang berubah hanya waktu pelatihan dan sedikit nilai uji silang
Decision Tree.

**Menjalankan ulang:** buka notebook dari GitHub di Google Colab, lalu pilih *Runtime → Run all* secara berurutan dari
Notebook 1 sampai 4. Notebook 4 akan me-restart sekali untuk memasang pustaka; setelah itu jalankan *Run all* lagi.

## 7. Keterbatasan

- **Klasifikasi belum sempurna.** F1 0,61 berarti sekitar 4 dari 10 laporan masih terlewat atau salah tebak. Karena itu Naive
  Bayes dipakai untuk mengukur persentase laporan per kelompok, bukan sebagai penyaring mutlak.
- **Batas antartopik tidak tegas.** Nilai *silhouette* hanya 0,07 (skalanya −1 sampai 1). Tweet itu pendek dan topiknya sering
  bercampur.
- **Peringkas belum terbukti lebih baik dari pilihan acak.** Selisih ROUGE Hybrid TF-IDF vs acak tidak signifikan secara
  statistik (uji Wilcoxon, p = 0,77). Sebabnya, tweet dalam satu kelompok sudah seragam topiknya, dan manusia menulis
  ringkasan dengan kata-kata sendiri sementara mesin hanya memilih tweet utuh. Antara dua manusia pun kesamaannya hanya 0,30.
- **Titik banjir di peta masih statis**, berasal dari 7 lokasi berita, bukan data sensor langsung.

## 8. Istilah

| Istilah | Arti sederhana |
|---|---|
| Agen cerdas | Program yang mengamati keadaan (tweet, peta) lalu bertindak untuk mencapai tujuan |
| PEAS | Cara mendeskripsikan agen: ukuran keberhasilan, lingkungan, aktuator (alat bertindak), sensor (alat mengamati) |
| Supervised learning | Komputer belajar dari contoh yang sudah diberi jawaban (Naive Bayes, KNN, Decision Tree) |
| Unsupervised learning | Komputer mencari pola sendiri tanpa jawaban (K-Means) |
| Klasterisasi | Pengelompokan data yang mirip |
| TF-IDF | Cara memberi bobot kata: penting kalau sering muncul di satu tweet tapi jarang di tweet lain |
| F1 | Skor 0–1 untuk ketepatan klasifikasi |
| Heuristik | Perkiraan yang membantu pencarian (di A\*: jarak garis lurus ke tujuan) |
| ROUGE | Skor kemiripan kata antara ringkasan mesin dan ringkasan manusia |
| ARI | Skor 0–1 kesamaan dua hasil pengelompokan; 1 berarti identik |
| Notebook | File berisi kode, penjelasan, dan hasil yang bisa dijalankan sel demi sel |

## 9. Peta folder

| Folder | Isi |
|---|---|
| `data/raw/` | Dataset asli, tidak diubah |
| `data/processed/` | Data hasil olahan |
| `data/reference/` | Set evaluasi dan ringkasan acuan buatan manusia |
| `notebooks/` | Notebook 1–4 serta modul bersama `teks.py` (pembersihan teks) dan `ringkas.py` (Hybrid TF-IDF) |
| `scripts/` | Pembuat diagram, laporan, dan data uji untuk web |
| `supabase/` | Struktur database |
| `web/` | Aplikasi web dan file model JSON |
| `docs/web/` | Dokumen untuk pengembang web (PRD, arsitektur, kontrak data) |
| `laporan/` | Laporan UTS, gambar, dan logo |
| `referensi/` | Daftar pustaka |
