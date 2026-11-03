import type { Preprocessing, StemLookup } from "./tipe";

/**
 * Port dari notebooks/teks.py::bersihkan.
 * Wajib identik dengan Python — jangan "memperbaiki" regex.
 */
export function bersihkan(teks: string): string {
  let t = teks.toLowerCase();
  t = t.replace(/https?:\/\/\S+|www\.\S+/g, " ");
  t = t.replace(/@[\p{L}\p{N}_]+/gu, " ");
  t = t.replaceAll("#", " ");
  t = t.replace(/\p{Nd}+([.,:]\p{Nd}+)*/gu, " angka ");
  t = t.replace(/[^a-z\s]/g, " ");
  return t.replace(/\s+/g, " ").trim();
}

export type AturanTeks = {
  stop: Set<string>;
  slang: Record<string, string>;
  stem: (w: string) => string;
};

export const stemLookupSaja =
  (lookup: StemLookup) =>
  (w: string): string =>
    lookup[w] ?? w;

export function buatAturan(pre: Preprocessing, stemLookup: StemLookup): AturanTeks {
  return {
    stop: new Set(pre.stopwords),
    slang: pre.slang,
    stem: stemLookupSaja(stemLookup),
  };
}

/**
 * Port dari notebooks/teks.py::preprocess.
 * Urutan: bersihkan → slang → buang stopword & kata 1 huruf → stem → buang stopword lagi.
 */
export function preprocess(teks: string, d: AturanTeks): string {
  const kata = bersihkan(teks)
    .split(" ")
    .filter(Boolean)
    .map((w) => d.slang[w] ?? w);
  const distem = kata
    .filter((w) => !d.stop.has(w) && w.length > 1)
    .map((w) => d.stem(w));
  return distem.filter((w) => !d.stop.has(w)).join(" ");
}
