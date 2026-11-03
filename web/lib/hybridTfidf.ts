export type HasilRingkas = {
  terpilih: number[];
  skor: number[];
};

export type OpsiRingkas = {
  n?: number;
  ambang?: number;
  batasMirip?: number;
};

/**
 * Port dari notebooks/ringkas.py::hybrid_tfidf.
 * Input: array teks HASIL PREPROCESS (satu tweet per elemen).
 */
export function hybridTfidf(kalimat: string[], opsi: OpsiRingkas = {}): HasilRingkas {
  const n = opsi.n ?? 3;
  const ambang = opsi.ambang ?? 11;
  const batasMirip = opsi.batasMirip ?? 0.77;

  const tok = kalimat.map((s) => s.split(" ").filter(Boolean));
  const N = tok.length;

  const semua = new Map<string, number>();
  for (const t of tok) for (const w of t) semua.set(w, (semua.get(w) ?? 0) + 1);

  let total = 0;
  for (const c of semua.values()) total += c;

  const df = new Map<string, number>();
  for (const t of tok) for (const w of new Set(t)) df.set(w, (df.get(w) ?? 0) + 1);

  const bobot = new Map<string, number>();
  if (total > 0 && N > 0) {
    for (const [w, c] of semua) {
      bobot.set(w, (c / total) * Math.log2(N / (df.get(w) ?? 1)));
    }
  }

  const skor = tok.map((t) => {
    let s = 0;
    for (const w of t) s += bobot.get(w) ?? 0;
    return s / Math.max(ambang, t.length);
  });

  const vec = tok.map((t) => {
    const m = new Map<string, number>();
    for (const w of t) m.set(w, (m.get(w) ?? 0) + 1);
    return m;
  });

  const urut = skor
    .map((_, i) => i)
    .sort((a, b) => skor[b] - skor[a] || a - b); // stabil: skor turun, seri → indeks kecil

  const terpilih: number[] = [];
  for (const i of urut) {
    if (terpilih.every((j) => cosine(vec[i], vec[j]) <= batasMirip)) terpilih.push(i);
    if (terpilih.length === n) break;
  }

  return { terpilih, skor };
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let num = 0;
  for (const [w, ca] of a) {
    const cb = b.get(w);
    if (cb !== undefined) num += ca * cb;
  }
  let na = 0;
  for (const v of a.values()) na += v * v;
  let nb = 0;
  for (const v of b.values()) nb += v * v;
  const den = Math.sqrt(na) * Math.sqrt(nb);
  if (den === 0) return 0;
  return num / den;
}
