import { describe, expect, it } from "vitest";
import pre from "../public/model/preprocessing.json";
import stem from "../public/model/stem_lookup.json";
import fx from "../fixtures/preprocessing_nb.json";
import { buatAturan, preprocess } from "../lib/teks";
import type { Preprocessing, StemLookup } from "../lib/tipe";

const aturan = buatAturan(pre as Preprocessing, stem as StemLookup);

describe("preprocessing identik dengan Python", () => {
  for (const kasus of fx) {
    it(kasus.text_raw.slice(0, 60), () => {
      expect(preprocess(kasus.text_raw, aturan)).toBe(kasus.text_clean);
    });
  }
});
