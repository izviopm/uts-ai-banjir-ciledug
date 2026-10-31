# Agen Cerdas Tanggap Banjir — Ciledug

Proyek UTS Kecerdasan Artifisial (Pertemuan 1–7), Universitas Budi Luhur.

**Ide:** agen yang membaca tweet tentang banjir, menentukan apakah tweet itu laporan kejadian banjir nyata (NLP + supervised learning), mengambil lokasinya, lalu mencari rute tercepat dari titik aman/posko ke lokasi di Ciledug dengan A*. Ruas jalan yang tergenang dihindari. Agen juga meringkas laporan dengan Hybrid TF-IDF.

## Arsitektur

```
[Google Colab / Python]  → notebook utama, dinilai dosen
   training & evaluasi: Naive Bayes vs KNN vs Decision Tree
   BFS vs DFS vs A* di peta jalan Ciledug (OpenStreetMap)
   peringkasan Hybrid TF-IDF
   ekspor model + graf → JSON
        │
        ▼
[Supabase: project budiluhur-university → schema uts_ai_bencana]
        │
        ▼
[Next.js + Tailwind + daisyUI + motion.dev + animate-ui → Vercel]  → demo presentasi
```

## Struktur folder

| Folder | Isi |
|---|---|
| `data/raw/` | Dataset asli dari sumber, **jangan diubah** |
| `data/processed/` | Hasil preprocessing dan label tingkat tweet |
| `notebooks/` | Notebook Colab (.ipynb) |
| `web/` | Aplikasi Next.js |
| `laporan/` | Laporan .docx, gambar, flowchart, slide |
| `referensi/` | PDF jurnal + `daftar-pustaka.md` |

## Dataset utama

**Semantic Role Labeling Datasets for Crisis Event** (Mendeley Data, v2, CC BY 4.0)
DOI: [10.17632/r76v5sjyv2.2](https://data.mendeley.com/datasets/r76v5sjyv2/2)
Paper: Ariyanto, A.D.P., Purwitasari, D., Amaliah, B., Fatichah, C., Taqiuddin, M.G., & Haikal. (2025). Annotated data for semantic role labeling of crisis events in Indonesian Tweets. *Data in Brief*, 61, 111688. https://doi.org/10.1016/j.dib.2025.111688

File yang sudah diunduh ke `data/raw/mendeley-srl-crisis/`:

| File | Isi | Dipakai untuk |
|---|---|---|
| `all-labeled-data-with-english-translation.csv` | 4.150 tweet berlabel per token: banjir 1.250, kebakaran 1.128, gempa 906, kecelakaan 866 | Klasifikasi (BAB III–IV), ekstraksi lokasi |
| `flood-with-english-translation.csv` | 43.028 tweet banjir mentah 2018–2023, tidak berlabel | Peringkasan Hybrid TF-IDF |

**Label tingkat tweet (hasil turunan):** label di dataset ini per token, jadi label per tweet diturunkan dari token bertanda event:
- `FLOOD-EVENT`: laporan kejadian banjir nyata, sekitar 365 tweet
- `FALSE-EVENT`: menyebut banjir tapi bukan laporan kejadian (politik, doa, opini), sekitar 880 tweet

Dengan begitu, tugas klasifikasinya adalah **"laporan banjir nyata" vs "bukan laporan"**. Kelasnya tidak seimbang (30:70), jadi evaluasi memakai F1 dan class weighting.

**Bonus:** token berlabel `B-LOC`/`PLACE-ARG`/`STREET-ARG` bisa dipakai untuk melatih atau mengevaluasi ekstraksi lokasi.

**Catatan data:** sebagian tweet berbahasa Melayu (banjir Malaysia). Ini akan ditangani di tahap preprocessing dan dibahas di laporan.

## Status

Lihat [TODO.md](TODO.md).
