import type {
  Graf,
  KlasterRingkasan,
  NaiveBayes,
  Preprocessing,
  StemLookup,
} from "./tipe";

const cache = new Map<string, Promise<unknown>>();

async function ambil<T>(path: string): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(path).then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat ${path} (${r.status})`);
      return r.json();
    });
    cache.set(path, p);
  }
  return p as Promise<T>;
}

export const muatPreprocessing = () => ambil<Preprocessing>("/model/preprocessing.json");
export const muatStem = () => ambil<StemLookup>("/model/stem_lookup.json");
export const muatNB = () => ambil<NaiveBayes>("/model/naive_bayes.json");
export const muatKlaster = () => ambil<KlasterRingkasan>("/model/klaster_ringkasan.json");

/** Graf 1,8 MB — hanya dipanggil di halaman Rute. */
export const muatGraf = () => ambil<Graf>("/model/graph_ciledug.json");

export function hapusUrl(teks: string): string {
  return teks.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
}
