import angka from "@/data/angka.json";
import { desimal } from "@/lib/format";

export default function TabelRouge() {
  const rouge = angka.nb4.rouge;
  const sepakat = angka.nb4.sepakat;
  const wilcoxon = angka.nb4.wilcoxon;

  return (
    <div className="space-y-5">
      <div role="alert" className="alert alert-warning alert-soft items-start">
        <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <h3 className="font-semibold">Peningkatan belum signifikan</h3>
          <p className="text-sm">
            Hybrid TF-IDF lebih tinggi dari TF-IDF standar pada ROUGE-1 dan ROUGE-L, tetapi uji Wilcoxon
            pada 10 set evaluasi memberi p &gt; 0,05 untuk semua pembanding. Angka ini ditampilkan apa
            adanya, bukan diklaim sebagai perbaikan yang terbukti.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300">
        <table className="table table-sm">
          <caption className="px-4 pt-4 text-left text-sm font-semibold">
            ROUGE rata-rata terhadap ringkasan acuan dua anotator
          </caption>
          <thead>
            <tr>
              <th>Metode</th>
              <th className="text-right">ROUGE-1</th>
              <th className="text-right">ROUGE-2</th>
              <th className="text-right">ROUGE-L</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(rouge).map(([nama, nilai]) => (
              <tr key={nama} className={nama.startsWith("Hybrid") ? "font-medium" : ""}>
                <td>
                  {nama}
                  {nama.startsWith("Hybrid") && (
                    <span className="badge badge-primary badge-xs ml-2">metode proyek</span>
                  )}
                </td>
                <td className="text-right font-mono">{desimal(nilai.R1, 4)}</td>
                <td className="text-right font-mono">{desimal(nilai.R2, 4)}</td>
                <td className="text-right font-mono">{desimal(nilai.RL, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <div className="kartu flex h-full flex-col p-5">
          <h3 className="text-sm font-semibold">Kesepakatan antar-anotator</h3>
          <p className="mt-1 text-xs text-base-content/55">
            Seberapa mirip ringkasan acuan anotator 1 dan 2. Nilai rendah berarti tugas peringkasan
            subjektif — batas atas ROUGE juga terbatas.
          </p>
          <dl className="mt-4 grid flex-1 grid-cols-3 gap-3 text-center">
            {Object.entries(sepakat).map(([k, v]) => (
              <div key={k} className="grid place-content-center rounded-2xl bg-base-200/70 p-3">
                <dt className="text-xs text-base-content/60">{k}</dt>
                <dd className="mt-1 font-mono text-xl font-semibold">{desimal(v, 4)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="kartu p-5">
          <h3 className="text-sm font-semibold">Uji Wilcoxon (10 set)</h3>
          <div className="mt-2 overflow-x-auto">
          <table className="table table-xs w-full">
            <caption className="sr-only">Uji Wilcoxon (10 set)</caption>
            <thead>
              <tr>
                <th>Pembanding</th>
                <th>Metrik</th>
                <th>Unggul</th>
                <th className="text-right">Selisih</th>
                <th className="text-right">p</th>
              </tr>
            </thead>
            <tbody>
              {wilcoxon.map((w, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap">{w.pembanding}</td>
                  <td>{w.metrik}</td>
                  <td className="whitespace-nowrap">{w.unggul}</td>
                  <td className="text-right font-mono">{desimal(w.selisih, 4)}</td>
                  <td className="text-right font-mono">{desimal(w.p, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
