# Spesifikasi Algoritma (port Python → TypeScript)

Acuan kode Python: `notebooks/teks.py`, `notebooks/ringkas.py`, dan `scripts/buat_fixtures_web.py`. Skrip terakhir menulis ulang
semua algoritma **hanya dari file JSON**, persis seperti yang akan dilakukan TypeScript, dan hasilnya sudah dicocokkan dengan notebook.
Jadi bila implementasi TS mengikuti dokumen ini dan lolos fixtures, hasilnya sama dengan penelitian.

Aturan umum: **jangan "memperbaiki" algoritma** (misalnya mengganti tie-breaking atau urutan tetangga). Perbedaan sekecil apa pun
mengubah hasil dan membuat fixtures gagal.

---

## 1. Preprocessing — `lib/teks.ts`

Data: `preprocessing.json` (`stopwords`, `slang`) dan `stem_lookup.json`.

```ts
export function bersihkan(teks: string): string {
  let t = teks.toLowerCase();
  t = t.replace(/https?:\/\/\S+|www\.\S+/g, " ");
  t = t.replace(/@[\p{L}\p{N}_]+/gu, " ");          // = Python r"@\w+" (Unicode)
  t = t.replaceAll("#", " ");
  t = t.replace(/\p{Nd}+([.,:]\p{Nd}+)*/gu, " angka "); // angka (tinggi air, jam, RT) → token "angka"
  t = t.replace(/[^a-z\s]/g, " ");
  return t.replace(/\s+/g, " ").trim();
}

export function preprocess(teks: string, d: { stop: Set<string>; slang: Record<string, string>; stem: (w: string) => string }): string {
  const kata = bersihkan(teks).split(" ").filter(Boolean).map((w) => d.slang[w] ?? w);
  const distem = kata.filter((w) => !d.stop.has(w) && w.length > 1).map(d.stem);  // filter panjang HANYA sebelum stem
  return distem.filter((w) => !d.stop.has(w)).join(" ");                         // stem bisa menghasilkan stopword
}
```

`stem(w)`: `stemLookup[w]` → jika tidak ada, **kembalikan `w` apa adanya** (lookup-only). Ini keputusan
final agar hasil TypeScript identik dengan `scripts/buat_fixtures_web.py`; `sastrawijs` tidak dipakai.

**Uji:** untuk setiap kasus di `fixtures/preprocessing_nb.json`, `preprocess(text_raw) === text_clean`.

---

## 2. Naive Bayes — `lib/naiveBayes.ts`

Data: `naive_bayes.json`. Input: teks **hasil preprocess**.

1. `tok = teks.split(" ")`; fitur = semua unigram `tok[i]` **ditambah** bigram `tok[i] + " " + tok[i+1]`.
2. Hitung `tf[j]` untuk fitur yang ada di `vocab` (indeks `j` = posisi di `vocab`). Fitur lain diabaikan.
3. Jika tidak ada fitur yang dikenal → `p = 0`, label `bukan_laporan`.
4. Bobot: `x[j] = (1 + ln(tf[j])) * idf[j]` (sublinear TF), lalu normalisasi L2: `x[j] /= sqrt(Σ x²)`.
5. Skor kelas `k ∈ {0,1}`: `s[k] = class_log_prior[k] + Σ_j x[j] * feature_log_prob[k][j]`.
6. Probabilitas laporan: `p = 1 / (1 + exp(s[0] - s[1]))`. Label `laporan` bila `p >= 0.5`.

Buat `Map<string, number>` dari `vocab` sekali saja saat model dimuat.

**Uji:** `|p - p_laporan| < 1e-9` dan label sama, untuk semua kasus di `fixtures/preprocessing_nb.json`.

---

## 3. Searching — `lib/graf.ts`

Data: `graph_ciledug.json`.

### 3.1 Membangun graf
```ts
const adj: { v: number; L: number; f: boolean }[][] = graf.nodes.map(() => []);
for (const [u, v, L, f] of graf.edges) adj[u].push({ v, L, f: f === 1 }); // URUTAN FILE = URUTAN TETANGGA
const GOALS = new Set(graf.safe_places.map((s) => s.node));
const biaya = (L: number, f: boolean, banjir: boolean) => L * (f && banjir ? graf.penalti : 1);
```

### 3.2 Heuristik A* (haversine, meter)
```ts
const rad = (d: number) => (d * Math.PI) / 180;
function hav(a: number, b: number) {
  const [la1, lo1] = graf.nodes[a], [la2, lo2] = graf.nodes[b];
  const p1 = rad(la1), p2 = rad(la2);
  const x = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(rad(lo2 - lo1) / 2) ** 2;
  return 12_742_000 * Math.asin(Math.sqrt(x));       // 2 × jari-jari bumi 6.371 km
}
const h = (n: number) => Math.min(...goalsArray.map((g) => hav(n, g)));   // ke tempat aman terdekat
```

### 3.3 Hasil yang dikembalikan
```ts
type Hasil = { algoritma: "BFS" | "DFS" | "UCS" | "A*"; path: number[]; expanded: number; jarak_m: number; biaya: number; jejak: number[] };
```
`jejak` = urutan node saat **di-expand** (dipakai animasi). `expanded = jejak.length`. `jarak_m` dan `biaya` dijumlah sepanjang `path`
memakai ruas `u → v` pertama yang ditemukan di `adj[u]`.

### 3.4 Pseudocode (wajib diikuti persis)

Semua algoritma: goal test dilakukan **saat node di-expand** (bukan saat dimasukkan ke frontier), dan `parent[start] = null`.

**BFS** (FIFO)
```
frontier = [start]; parent = {start: null}
while frontier tidak kosong:
    u = frontier.shift(); expand(u)
    if u ∈ GOALS: return
    for (v) in adj[u] (urutan normal):
        if v ∉ parent: parent[v] = u; frontier.push(v)
```
Gunakan antrean berindeks (array + pointer kepala), bukan `Array.shift()` yang O(n).

**DFS** (LIFO, iteratif)
```
stack = [start]; parent = {start: null}; visited = {}
while stack tidak kosong:
    u = stack.pop()
    if u ∈ visited: continue
    visited.add(u); expand(u)
    if u ∈ GOALS: return
    for (v) in adj[u] DIBALIK (dari tetangga terakhir ke pertama):
        if v ∉ visited: parent[v] = u; stack.push(v)     // parent boleh ditimpa
```

**UCS dan A\*** (UCS = A\* dengan `h = 0`)
```
g = {start: 0}; parent = {start: null}; closed = {}
heap = [(f = h(start), k = 0, start)]; counter = 1
while heap tidak kosong:
    (_, _, u) = pop elemen dengan f terkecil; bila f sama → k terkecil
    if u ∈ closed: continue
    closed.add(u); expand(u)
    if u ∈ GOALS: return
    for (v, L, f) in adj[u] (urutan normal):
        ng = g[u] + biaya(L, f, banjir)
        if ng < (g[v] ?? Infinity):
            g[v] = ng; parent[v] = u
            push (ng + h(v), counter, v); counter++
```
Tie-breaking `(f, k)` wajib, karena menentukan urutan expand saat f sama. Implementasikan min-heap biner sendiri (±30 baris);
pembanding: `a.f - b.f || a.k - b.k`.

**Uji:** untuk setiap kasus di `fixtures/searching.json` (goals = semua `safe_places[].node`, `banjir = skenario === "banjir"`):
`expanded` sama persis, `path` sama persis, `jejak.slice(0, 50)` sama dengan `jejak_awal`, serta `|jarak_m|` dan `|biaya|` selisih < 0,01.

### 3.5 Snap klik peta ke node (F11)
Cari node dengan `hav` terkecil ke koordinat klik (scan linear 19 ribu node cukup cepat, < 20 ms).

---

## 4. Hybrid TF-IDF — `lib/hybridTfidf.ts`

Input: array teks **hasil preprocess** (satu tweet per elemen), `n = 3`, `ambang = 11`, `batas_mirip = 0.77`
(ambil dari `klaster_ringkasan.json → hybrid_tfidf`).

1. `tok[i] = teks[i].split(" ").filter(Boolean)`; `N = jumlah tweet`.
2. `semua[w]` = frekuensi kata `w` di **seluruh** tweet; `total = Σ semua[w]`.
3. `df[w]` = jumlah tweet yang memuat `w` (dihitung sekali per tweet).
4. `bobot[w] = (semua[w] / total) * log2(N / df[w])`.
5. `skor[i] = (Σ bobot[w] untuk setiap token w di tok[i], termasuk pengulangan) / max(ambang, tok[i].length)`.
6. Urutkan indeks: **skor menurun; bila sama, indeks lebih kecil dulu** (sort stabil).
7. Seleksi: telusuri urutan itu; ambil `i` bila `cosine(i, j) <= batas_mirip` untuk semua `j` yang sudah terpilih; berhenti saat `n` terpilih.
   `cosine` dihitung pada vektor **jumlah kata** (bag-of-words), dan bernilai 0 bila salah satu vektor kosong.
8. Kembalikan indeks terpilih (urut sesuai pemilihan) dan `skor`.

Untuk F3: tiap baris input dipreprocess; baris kosong setelah preprocess tetap dihitung sebagai tweet (skornya 0). Tampilkan teks asli
baris terpilih. Minta minimal 5 baris.

**Uji:** untuk setiap set di `fixtures/hybrid_tfidf.json`: `terpilih` sama persis dan `|skor[i] - fixture| < 1e-9`.

---

## 5. Contoh uji (vitest)

```ts
// tests/graf.test.ts
import { describe, expect, it } from "vitest";
import graf from "../public/model/graph_ciledug.json";
import fx from "../fixtures/searching.json";
import { buatGraf, cari } from "../lib/graf";

const G = buatGraf(graf as any);
describe("searching identik dengan Python", () => {
  for (const c of fx.kasus) {
    it(`${c.asal} · ${c.skenario} · ${c.algoritma}`, () => {
      const r = cari(G, c.algoritma as any, c.start, c.skenario === "banjir");
      expect(r.expanded).toBe(c.expanded);
      expect(r.path).toEqual(c.path);
      expect(r.jejak.slice(0, 50)).toEqual(c.jejak_awal);
      expect(Math.abs(r.jarak_m - c.jarak_m)).toBeLessThan(0.01);
    });
  }
});
```
Tambahkan `"test": "vitest run"` di `package.json`. Seluruh uji wajib hijau sebelum deploy.

---

## 6. Angka acuan dari penelitian (untuk cek cepat)

| Hal | Nilai |
|---|---|
| Naive Bayes (uji) | F1 0,612 · akurasi 0,766 · presisi 0,616 · recall 0,608 |
| A* vs UCS, 7 titik banjir, skenario banjir | expanded rata-rata 135,6 vs 554,7; jarak sama 1.470 m |
| Studi kasus Jl. Raden Saleh Raya | A* normal 0,23 km → A* banjir 1,73 km |
| Klasterisasi | K-Means, k = 11 (metode elbow), 3.390 tweet Jabodetabek |
