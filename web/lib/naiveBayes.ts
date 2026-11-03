import type { NaiveBayes } from "./tipe";

export type ModelNB = {
  vocabSize: number;
  prediksi: (teksBersih: string) => { p: number; label: "laporan" | "bukan_laporan" };
};

/**
 * Port dari scripts/buat_fixtures_web.py::nb_prob.
 * Input: teks hasil preprocess (bukan teks mentah).
 */
export function buatNB(nb: NaiveBayes): ModelNB {
  const idx = new Map<string, number>();
  for (let i = 0; i < nb.vocab.length; i++) idx.set(nb.vocab[i], i);

  const prior = nb.class_log_prior;
  const flp = nb.feature_log_prob;
  const idf = nb.idf;

  function prediksi(teksBersih: string) {
    const tok = teksBersih.split(" ").filter(Boolean);
    const grams: string[] = [...tok];
    for (let i = 0; i + 1 < tok.length; i++) grams.push(`${tok[i]} ${tok[i + 1]}`);

    // tf per indeks fitur yang dikenal
    const tf = new Map<number, number>();
    for (const g of grams) {
      const j = idx.get(g);
      if (j !== undefined) tf.set(j, (tf.get(j) ?? 0) + 1);
    }

    if (tf.size === 0) return { p: 0, label: "bukan_laporan" as const };

    // bobot sublinear TF, lalu normalisasi L2
    let n2 = 0;
    const bobot = new Map<number, number>();
    for (const [j, c] of tf) {
      const x = (1 + Math.log(c)) * idf[j];
      bobot.set(j, x);
      n2 += x * x;
    }
    const n = Math.sqrt(n2) || 1;

    const s0 = prior[0] + sumKali(bobot, flp[0], n);
    const s1 = prior[1] + sumKali(bobot, flp[1], n);

    const p = 1 / (1 + Math.exp(s0 - s1));
    return { p, label: p >= 0.5 ? ("laporan" as const) : ("bukan_laporan" as const) };
  }

  return { vocabSize: nb.vocab.length, prediksi };
}

function sumKali(bobot: Map<number, number>, logProb: number[], n: number): number {
  let s = 0;
  for (const [j, x] of bobot) s += (x / n) * logProb[j];
  return s;
}
