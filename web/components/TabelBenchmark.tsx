import angka from "@/data/angka.json";
import type { SearchRun } from "@/lib/tipe";
import { desimal, ribuan } from "@/lib/format";

const URUT = ["BFS", "DFS", "UCS", "A*"];

function normalisasiAlg(a: string): string {
  const u = a.trim().toUpperCase();
  if (u === "ASTAR" || u === "A_STAR" || u === "A STAR") return "A*";
  return u;
}

type Baris = { skenario: string; algoritma: string; expanded: number; jarak: number; n: number };

function dariDatabase(runs: SearchRun[]): Baris[] {
  const map = new Map<string, { exp: number; jarak: number; n: number }>();
  for (const r of runs) {
    const alg = normalisasiAlg(r.algorithm);
    const key = `${r.scenario}|${alg}`;
    const cur = map.get(key) ?? { exp: 0, jarak: 0, n: 0 };
    cur.exp += r.nodes_expanded ?? 0;
    cur.jarak += r.path_length_m ?? 0;
    cur.n += 1;
    map.set(key, cur);
  }
  return [...map.entries()].map(([key, v]) => {
    const [skenario, algoritma] = key.split("|");
    return { skenario, algoritma, expanded: v.exp / v.n, jarak: v.jarak / v.n, n: v.n };
  });
}

function dariLokal(): Baris[] {
  return Object.entries(angka.nb3.rata_titik_banjir).map(([key, v]) => {
    const [skenario, algoritma] = key.split("|");
    return { skenario, algoritma, expanded: v.expanded, jarak: v.jarak, n: 7 };
  });
}

export default function TabelBenchmark({ runs }: { runs: SearchRun[] | null }) {
  const baris = runs ? dariDatabase(runs) : dariLokal();
  const sumberDb = Boolean(runs);

  const skenario = ["normal", "banjir"];
  const maxExp = Math.max(...baris.map((b) => b.expanded), 1);

  return (
    <div className="space-y-4">
      {!sumberDb && (
        <div role="status" className="alert alert-warning alert-soft">
          <span>
            Data database tidak tersedia, menampilkan data lokal dari <code>angka.json</code>. Angka tetap
            berasal dari hasil notebook.
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-sm">
          <caption className="px-4 pt-4 text-left text-sm font-semibold">
            Rata-rata per algoritma dan skenario
            <span className="ml-2 font-normal text-base-content/55">
              ({sumberDb ? `${runs?.length} baris search_runs` : "7 titik banjir"})
            </span>
          </caption>
          <thead>
            <tr>
              <th>Skenario</th>
              <th>Algoritma</th>
              <th className="text-right">Node diperiksa</th>
              <th className="text-right">Jarak rata-rata</th>
              <th className="text-right">n</th>
            </tr>
          </thead>
          <tbody>
            {skenario.flatMap((sk) =>
              URUT.map((alg) => {
                const b = baris.find((x) => x.skenario === sk && x.algoritma === alg);
                if (!b) return null;
                return (
                  <tr key={`${sk}-${alg}`} className={alg === "A*" ? "bg-success/10 font-medium" : ""}>
                    <td className="capitalize">{sk}</td>
                    <td>{alg}</td>
                    <td className="text-right font-mono">{desimal(b.expanded, 1)}</td>
                    <td className="text-right font-mono">
                      {b.jarak >= 1000 ? `${desimal(b.jarak / 1000, 2)} km` : `${ribuan(b.jarak)} m`}
                    </td>
                    <td className="text-right text-base-content/50">{b.n}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <h3 className="text-sm font-semibold">Node yang diperiksa (makin kecil makin baik)</h3>
        <p className="mt-1 text-xs text-base-content/55">
          A* memakai heuristik jarak garis lurus; UCS tidak. Pada skenario banjir, selisihnya paling
          terlihat.
        </p>
        <div className="mt-3 space-y-3">
          {skenario.map((sk) => (
            <div key={sk}>
              <p className="mb-1 text-xs font-medium capitalize text-base-content/70">{sk}</p>
              <div className="space-y-1.5">
                {URUT.map((alg) => {
                  const b = baris.find((x) => x.skenario === sk && x.algoritma === alg);
                  if (!b) return null;
                  return (
                    <div key={alg} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 font-mono text-xs">{alg}</span>
                      <div className="h-4 flex-1 overflow-hidden rounded bg-base-200">
                        <div
                          className={`h-full rounded ${alg === "A*" ? "bg-success" : "bg-primary/60"}`}
                          style={{ width: `${Math.max(2, (b.expanded / maxExp) * 100)}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right font-mono text-xs">
                        {desimal(b.expanded, 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-base-content/55">
          Waktu eksekusi (runtime_ms) diukur di Python dan bergantung mesin, jadi tidak dipakai sebagai
          pembanding utama.
        </p>
      </div>
    </div>
  );
}
