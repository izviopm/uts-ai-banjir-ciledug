import { describe, expect, it } from "vitest";
import fx from "../fixtures/hybrid_tfidf.json";
import { hybridTfidf } from "../lib/hybridTfidf";

describe("Hybrid TF-IDF identik dengan Python", () => {
  for (const set of fx) {
    it(set.set_id, () => {
      const hasil = hybridTfidf(set.text_clean);
      expect(hasil.terpilih).toEqual(set.terpilih);
      expect(hasil.skor.length).toBe(set.skor.length);
      for (let i = 0; i < set.skor.length; i++) {
        expect(Math.abs(hasil.skor[i] - set.skor[i])).toBeLessThan(1e-9);
      }
    });
  }
});
