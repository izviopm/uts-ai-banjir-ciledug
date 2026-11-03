# Kontrak Data

Semua bentuk data yang dibaca web. Tipe ditulis dalam TypeScript; salin ke `web/lib/tipe.ts`.

## A. File statis `web/public/model/` (diakses sebagai `/model/<nama>.json`)

### `preprocessing.json`
```ts
type Preprocessing = {
  stopwords: string[];              // 129 kata; sudah dikurangi kata penting (tidak, sudah, masih, ...)
  slang: Record<string, string>;    // 41 entri, mis. "gak" → "tidak"
};
```

### `stem_lookup.json`
```ts
type StemLookup = Record<string, string>; // kata → hasil stem Sastrawi Python, hanya untuk kata yang berubah
```
Dibuat oleh `scripts/buat_fixtures_web.py` dari seluruh kata di korpus. **Lookup-only**: kata yang tidak ada di sini
dipakai apa adanya (tanpa `sastrawijs`) agar hasil identik dengan Python.

### `naive_bayes.json`
```ts
type NaiveBayes = {
  model: "MultinomialNB";
  classes: ["bukan_laporan", "laporan"];        // indeks 0 dan 1
  tfidf: { ngram_range: [1, 2]; sublinear_tf: true; norm: "l2" };
  vocab: string[];                              // 2.851 fitur (unigram dan bigram "kata1 kata2"); indeks = posisi
  idf: number[];                                // panjang = vocab
  class_log_prior: [number, number];            // log P(kelas); bernilai sama karena fit_prior=False
  feature_log_prob: [number[], number[]];       // [kelas][fitur] = log P(fitur | kelas)
  metrics: { accuracy: number; precision_score: number; recall: number; f1: number }; // pada data uji
};
```

### `graph_ciledug.json` (±1,9 MB, muat hanya di halaman Rute)
```ts
type Graf = {
  center: [number, number];                     // [lat, lon] Kantor Kecamatan Ciledug
  penalti: number;                              // 20 → biaya ruas tergenang = panjang × 20 (skenario banjir)
  nodes: [number, number][];                    // 19.066 persimpangan, [lat, lon]; indeks = id node
  edges: [number, number, number, 0 | 1][];     // 43.689 ruas berarah [u, v, panjang_m, tergenang]
  safe_places: { node: number; name: string; kind: string; lat: number; lon: number }[];   // 65 tempat aman = GOAL
  flood_points: { node: number; name: string; lat: number; lon: number; radius_m: number; source_url: string }[]; // 7 titik BPBD
};
```
- `edges` berarah (jalan satu arah). **Urutan baris `edges` adalah urutan tetangga** dan wajib dipertahankan saat membangun
  daftar ketetanggaan, karena BFS/DFS bergantung pada urutan ini.
- `kind`: `hospital`, `clinic`, `fire_station`, `police`, `townhall`. Sebagian `name` = `"(tanpa nama)"`.
- `safe_places` sudah tidak memuat tempat yang berada di dalam radius genangan.

### `klaster_ringkasan.json`
```ts
type TweetRingkasan = { text: string; waktu: string /* YYYY-MM-DD */; skor: number; p_laporan: number; sumber: "laporan" | "semua" };
type KlasterRingkasan = {
  algoritma: "K-Means";
  k: number;                                    // 11
  klaster: {                                    // sudah terurut dari % laporan tertinggi
    id: number; jumlah: number; pct_laporan: number;
    kata_kunci: string;                         // 8 kata dipisah ", "
    ringkasan: TweetRingkasan[];                // 3 tweet hasil Hybrid TF-IDF
  }[];
  titik: [number, number, number][];            // 1.500 sampel [x, y, id_klaster] untuk scatter 2D (LSA → SVD 2D)
  hybrid_tfidf: { ambang: number; batas_mirip: number; n: number }; // parameter untuk F3
};
```
- `sumber = "laporan"`: ringkasan dibuat hanya dari tweet yang diprediksi laporan; `"semua"`: klaster hampir tanpa laporan.
- Teks tweet masih mengandung URL `https://t.co/...`; hapus saat ditampilkan.

## B. Supabase

| | |
|---|---|
| URL | `https://amrdiynitvyfxyvkwsag.supabase.co` |
| Schema | `uts_ai_bencana` (sudah diekspos di Data API) |
| Akses | Publishable key → hanya `SELECT` (RLS `read_all`). Insert/update ditolak. |

```ts
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { db: { schema: "uts_ai_bencana" } });
```

| Tabel | Baris | Kolom penting | Dipakai di |
|---|---|---|---|
| `tweets` | 1.220 | `id` (BAN-xxxxx), `text_raw`, `text_clean`, `label` (`laporan`/`bukan_laporan`), `split` (`train`/`test`), `locations text[]` | Klasifikasi (contoh) |
| `predictions` | 732 | `tweet_id` → tweets.id, `model` (`naive_bayes`/`knn`/`decision_tree`), `predicted`, `probability` | Klasifikasi (contoh salah/benar) |
| `model_metrics` | 3 | `model`, `accuracy`, `precision_score`, `recall`, `f1`, `cv_f1_mean`, `cv_f1_std`, `confusion_matrix` (jsonb `[[TN,FP],[FN,TP]]`), `best_params` (jsonb), `train_time_ms` | Beranda, Klasifikasi |
| `safe_places` | 65 | `id` (osmid), `name`, `kind`, `lat`, `lon` | (sama dengan JSON graf) |
| `flood_points` | 7 | `name`, `lat`, `lon`, `radius_m`, `source_url` | Tentang (sumber data) |
| `search_runs` | 56 | `scenario` (`normal`/`banjir`), `algorithm` (`BFS`/`DFS`/`UCS`/`A*`), `origin_node`, `goal_node` (**osmid**, bukan indeks JSON), `path_length_m`, `nodes_expanded`, `runtime_ms`, `path` (jsonb `[[lat,lon],…]`) | Beranda, Benchmark (F7) |
| `summaries` | 11 | `period` (`klaster-<id>`), `n_tweets`, `summary` (jsonb `{kata_kunci, pct_laporan, algoritma, tweets: TweetRingkasan[]}`) | Klaster (opsional) |

Contoh query:
```ts
const { data: metrik } = await supabase.from("model_metrics").select("model, f1, accuracy, precision_score, recall, confusion_matrix");
const { data: runs } = await supabase.from("search_runs").select("scenario, algorithm, nodes_expanded, path_length_m");
const { data: contoh } = await supabase.from("predictions").select("predicted, probability, tweets(text_raw, label)").eq("model", "naive_bayes").limit(20);
```
`runtime_ms` di `search_runs` diukur di Python dan bergantung mesin; tampilkan sebagai keterangan saja, bukan perbandingan utama.

## C. Fixtures `web/fixtures/` (khusus pengujian, tidak dimuat di halaman)

| File | Isi | Diuji terhadap |
|---|---|---|
| `preprocessing_nb.json` | 32 kasus `{text_raw, text_clean, p_laporan, label}` | `lib/teks.ts`, `lib/naiveBayes.ts` |
| `searching.json` | 56 kasus (7 titik banjir × 2 skenario × 4 algoritma) `{start, skenario, algoritma, expanded, jarak_m, biaya, path, jejak_awal}` | `lib/graf.ts` |
| `hybrid_tfidf.json` | 10 set × 25 tweet `{text_clean[], terpilih[], skor[]}` | `lib/hybridTfidf.ts` |
