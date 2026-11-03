import { describe, expect, it } from "vitest";
import grafJson from "../public/model/graph_ciledug.json";
import fx from "../fixtures/searching.json";
import { buatGraf } from "../lib/graf";
import type { Algoritma, Graf } from "../lib/tipe";

const G = buatGraf(grafJson as unknown as Graf);

describe("searching identik dengan Python", () => {
  for (const kasus of fx.kasus) {
    it(`${kasus.asal} · ${kasus.skenario} · ${kasus.algoritma}`, () => {
      const r = G.cari(kasus.start, kasus.algoritma as Algoritma, kasus.skenario === "banjir");
      expect(r.expanded).toBe(kasus.expanded);
      expect(r.path).toEqual(kasus.path);
      expect(r.jejak.slice(0, 50)).toEqual(kasus.jejak_awal);
      expect(Math.abs(r.jarak_m - kasus.jarak_m)).toBeLessThan(0.01);
      expect(Math.abs(r.biaya - kasus.biaya)).toBeLessThan(0.01);
    });
  }
});
