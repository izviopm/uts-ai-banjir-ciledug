import { describe, expect, it } from "vitest";
import pre from "../public/model/preprocessing.json";
import stem from "../public/model/stem_lookup.json";
import nbJson from "../public/model/naive_bayes.json";
import fx from "../fixtures/preprocessing_nb.json";
import { buatNB } from "../lib/naiveBayes";
import { buatAturan, preprocess } from "../lib/teks";
import type { NaiveBayes, Preprocessing, StemLookup } from "../lib/tipe";

const aturan = buatAturan(pre as Preprocessing, stem as StemLookup);
const nb = buatNB(nbJson as unknown as NaiveBayes);

describe("Naive Bayes identik dengan Python", () => {
  for (const kasus of fx) {
    it(kasus.text_raw.slice(0, 60), () => {
      const hasil = nb.prediksi(preprocess(kasus.text_raw, aturan));
      expect(Math.abs(hasil.p - kasus.p_laporan)).toBeLessThan(1e-9);
      expect(hasil.label).toBe(kasus.label);
    });
  }
});
