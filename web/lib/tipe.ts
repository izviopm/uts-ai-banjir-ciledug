// Tipe data sesuai docs/web/KONTRAK-DATA.md

export type Preprocessing = {
  stopwords: string[];
  slang: Record<string, string>;
};

export type StemLookup = Record<string, string>;

export type NaiveBayes = {
  model: "MultinomialNB";
  classes: ["bukan_laporan", "laporan"];
  tfidf: { ngram_range: [number, number]; sublinear_tf: boolean; norm: string };
  vocab: string[];
  idf: number[];
  class_log_prior: [number, number];
  feature_log_prob: [number[], number[]];
  metrics: { accuracy: number; precision_score: number; recall: number; f1: number };
};

export type Graf = {
  center: [number, number];
  penalti: number;
  nodes: [number, number][];
  edges: [number, number, number, 0 | 1][];
  safe_places: TempatAman[];
  flood_points: TitikBanjir[];
};

export type TempatAman = {
  node: number;
  name: string;
  kind: string;
  lat: number;
  lon: number;
};

export type TitikBanjir = {
  node: number;
  name: string;
  lat: number;
  lon: number;
  radius_m: number;
  source_url: string;
};

export type TweetRingkasan = {
  text: string;
  waktu: string;
  skor: number;
  p_laporan: number;
  sumber: "laporan" | "semua";
};

export type Klaster = {
  id: number;
  jumlah: number;
  pct_laporan: number;
  kata_kunci: string;
  ringkasan: TweetRingkasan[];
};

export type KlasterRingkasan = {
  algoritma: string;
  k: number;
  klaster: Klaster[];
  titik: [number, number, number][];
  hybrid_tfidf: { ambang: number; batas_mirip: number; n: number };
};

export type Algoritma = "BFS" | "DFS" | "UCS" | "A*";

export type Hasil = {
  algoritma: Algoritma;
  path: number[];
  expanded: number;
  jarak_m: number;
  biaya: number;
  jejak: number[];
};

// ---- Supabase ----
export type MetrikModel = {
  model: string;
  accuracy: number | null;
  precision_score: number | null;
  recall: number | null;
  f1: number | null;
  cv_f1_mean: number | null;
  cv_f1_std: number | null;
  confusion_matrix: number[][] | null;
  best_params: Record<string, unknown> | null;
  train_time_ms: number | null;
};

export type SearchRun = {
  scenario: string;
  algorithm: string;
  nodes_expanded: number | null;
  path_length_m: number | null;
  runtime_ms: number | null;
};
