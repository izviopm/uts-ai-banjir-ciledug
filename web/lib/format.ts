const angkaId = new Intl.NumberFormat("id-ID");

export const ribuan = (n: number) => angkaId.format(Math.round(n));

export const desimal = (n: number, d = 2) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export const persen = (n: number, d = 1) => `${desimal(n, d)}%`;

/** meter → "1,73 km" atau "230 m" */
export function jarak(m: number): string {
  if (m >= 1000) return `${desimal(m / 1000, 2)} km`;
  return `${ribuan(m)} m`;
}

/** Selalu dalam km — dipakai panel hasil rute agar konsisten dengan narasi demo. */
export const km = (m: number) => `${desimal(m / 1000, 2)} km`;

export function tanggal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export const NAMA_MODEL: Record<string, string> = {
  naive_bayes: "Naive Bayes",
  knn: "K-Nearest Neighbors",
  decision_tree: "Decision Tree",
};

export const NAMA_JENIS: Record<string, string> = {
  hospital: "Rumah sakit",
  clinic: "Klinik / puskesmas",
  fire_station: "Pemadam kebakaran",
  police: "Kantor polisi",
  townhall: "Kantor pemerintahan",
  school: "Sekolah",
};

export const WARNA_KLASTER = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
  "#0d9488",
];
