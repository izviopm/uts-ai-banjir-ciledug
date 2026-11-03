# Agen Cerdas Tanggap Banjir — Ciledug

Proyek UTS Kecerdasan Artifisial (Pertemuan 1–7), Universitas Budi Luhur.

**Demo web:** https://banjir-cileduk.vercel.app

**Repositori GitHub:** https://github.com/izviopm/uts-ai-banjir-ciledug

**Ide:** agen yang membaca tweet tentang banjir, menentukan apakah tweet itu laporan kejadian banjir nyata (NLP + supervised learning), mengelompokkan dan meringkas tweet per topik dengan Hybrid TF-IDF, lalu mencari rute evakuasi di Ciledug dengan A*: dari titik banjir ke tempat aman terdekat, dengan menghindari ruas jalan yang tergenang.

> Penjelasan lengkap untuk pembaca awam (alur, letak dataset, hasil, keterbatasan, cara menjalankan web): **[PANDUAN_PROYEK.md](docs/PANDUAN_PROYEK.md)**

> Catatan: nama tempat di tweet ikut diekstrak (Notebook 1) dan disimpan sebagai bahan analisis, tetapi belum dipakai sebagai titik awal rute. Titik awal rute berasal dari 7 titik genangan hasil pemberitaan BPBD atau dipilih sendiri di peta.

## Arsitektur

```
[Google Colab / Python]  → notebook utama, dinilai dosen
   training & evaluasi: Naive Bayes vs KNN vs Decision Tree
   BFS vs DFS vs UCS vs A* di peta jalan Ciledug (OpenStreetMap)
   klasterisasi (TF-IDF + LSA + K-Means) dan peringkasan Hybrid TF-IDF
   ekspor model + graf → JSON
        │
        ▼
[Supabase: project budiluhur-university → schema uts_ai_bencana]   (opsional untuk web)
        │
        ▼
[Next.js + Tailwind + daisyUI + Leaflet → Vercel]  → demo presentasi
```

Web tetap berjalan tanpa Supabase: metrik dan benchmark diambil dari `web/data/angka.json`, sedangkan model dan graf dibaca dari `web/public/model/*.json`.

## Struktur folder

| Folder | Isi |
|---|---|
| `data/raw/` | Dataset asli dari sumber, **jangan diubah** |
| `data/processed/` | Hasil preprocessing, label tingkat tweet, dan metrik model |
| `data/reference/` | Set evaluasi peringkas, label klaster acuan, dan ringkasan tulisan tangan |
| `notebooks/` | Notebook 1–4 (`.ipynb` untuk Colab, pasangan `.py` untuk dijalankan lokal), modul bersama `teks.py` dan `ringkas.py` |
| `scripts/` | Pembuat diagram, laporan, angka laporan, dan data uji untuk web |
| `cache/` | Unduhan mentah OpenStreetMap (Overpass) yang dipakai Notebook 3 |
| `supabase/` | Struktur database (`schema.sql`) |
| `web/` | Aplikasi Next.js dan file model JSON di `web/public/model/` |
| `docs/` | README ini, panduan proyek, dan dokumen pengembang web di `docs/web/` |
| `laporan/` | Laporan .docx/.pdf, gambar, flowchart, dan `angka.json` |
| `referensi/` | PDF jurnal + `daftar-pustaka.md` |

## Dataset utama

**Semantic Role Labeling Datasets for Crisis Event** (Mendeley Data, v2, CC BY 4.0)
DOI: [10.17632/r76v5sjyv2.2](https://data.mendeley.com/datasets/r76v5sjyv2/2)
Paper: Ariyanto, A.D.P., Purwitasari, D., Amaliah, B., Fatichah, C., Taqiuddin, M.G., & Haikal. (2025). Annotated data for semantic role labeling of crisis events in Indonesian Tweets. *Data in Brief*, 61, 111688. https://doi.org/10.1016/j.dib.2025.111688

File yang sudah diunduh ke `data/raw/mendeley-srl-crisis/`:

| File | Isi | Dipakai untuk |
|---|---|---|
| `all-labeled-data-with-english-translation.csv` | 4.150 tweet berlabel per token: banjir 1.250, kebakaran 1.128, gempa 906, kecelakaan 866 | Klasifikasi (BAB III–IV), ekstraksi lokasi |
| `flood-with-english-translation.csv` | 43.028 tweet banjir mentah 2018–2023, tidak berlabel | Klasterisasi dan peringkasan Hybrid TF-IDF |

**Label tingkat tweet (hasil turunan):** label di dataset ini per token, jadi label per tweet diturunkan dari token bertanda event. Dari 1.250 tweet banjir, setelah 30 tweet berbahasa Melayu dibuang, tersisa **1.220 tweet**:
- `laporan` (memuat token `FLOOD-EVENT`, yaitu laporan kejadian banjir nyata): **368 tweet**
- `bukan_laporan` (menyebut banjir tetapi bukan laporan kejadian: politik, doa, opini): **852 tweet**

Dengan begitu, tugas klasifikasinya adalah **"laporan banjir nyata" vs "bukan laporan"**. Kelasnya tidak seimbang (sekitar 30:70), jadi evaluasi memakai F1 dan class weighting.

**Bonus:** token berlabel `B-LOC`/`PLACE-ARG`/`STREET-ARG` diekstrak menjadi kolom `locations` (tersimpan di Supabase dan dipakai untuk eksplorasi di Notebook 1). Kolom ini belum dipakai oleh pencarian rute.

**Catatan data:** sebagian tweet berbahasa Melayu (banjir Malaysia). Tweet itu dibuang pada tahap preprocessing dan dibahas di laporan.
