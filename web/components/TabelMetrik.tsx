import type { MetrikModel } from "@/lib/tipe";
import { NAMA_MODEL, desimal } from "@/lib/format";

const URUT = ["naive_bayes", "knn", "decision_tree"];

export default function TabelMetrik({
  data,
  dariDb,
}: {
  data: MetrikModel[];
  dariDb: boolean;
}) {
  const baris = [...data].sort((a, b) => URUT.indexOf(a.model) - URUT.indexOf(b.model));

  return (
    <div className="space-y-2">
      {!dariDb && (
        <div role="status" className="alert alert-warning alert-soft">
          <span>
            Data database tidak tersedia, menampilkan metrik lokal dari <code>angka.json</code>.
          </span>
        </div>
      )}
      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-sm">
          <caption className="px-4 pt-4 text-left text-sm font-semibold">
            Metrik pada 244 tweet uji
          </caption>
          <thead>
            <tr>
              <th>Model</th>
              <th className="text-right">Akurasi</th>
              <th className="text-right">Presisi</th>
              <th className="text-right">Recall</th>
              <th className="text-right">F1</th>
              <th className="text-right">CV F1</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((m) => (
              <tr key={m.model} className={m.model === "naive_bayes" ? "bg-primary/5 font-medium" : ""}>
                <td>
                  <span className="flex flex-wrap items-center gap-2">
                    {NAMA_MODEL[m.model] ?? m.model}
                    {m.model === "naive_bayes" && (
                      <span className="badge badge-primary badge-sm">model terpilih</span>
                    )}
                  </span>
                </td>
                <td className="text-right font-mono">{desimal(m.accuracy ?? 0, 4)}</td>
                <td className="text-right font-mono">{desimal(m.precision_score ?? 0, 4)}</td>
                <td className="text-right font-mono">{desimal(m.recall ?? 0, 4)}</td>
                <td className="text-right font-mono">{desimal(m.f1 ?? 0, 4)}</td>
                <td className="text-right font-mono">
                  {desimal(m.cv_f1_mean ?? 0, 3)} ± {desimal(m.cv_f1_std ?? 0, 3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-base-content/55">
        Naive Bayes dipilih karena F1 cross-validation tertinggi (0,687 ± 0,025). F1 pada data uji 0,612 —
        model masih sering salah pada tweet kiasan atau tidak lengkap.
      </p>
    </div>
  );
}
