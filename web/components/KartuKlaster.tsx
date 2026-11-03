import type { Klaster } from "@/lib/tipe";
import { hapusUrl } from "@/lib/data";
import { desimal, persen, tanggal, WARNA_KLASTER } from "@/lib/format";

export default function KartuKlaster({ klaster }: { klaster: Klaster }) {
  const sumber = klaster.ringkasan[0]?.sumber ?? "semua";
  const laporanTinggi = klaster.pct_laporan >= 30;
  const warna = WARNA_KLASTER[klaster.id % WARNA_KLASTER.length];

  return (
    <article className={`kartu flex h-full flex-col gap-4 p-5 ${laporanTinggi ? "!border-success/50" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="grid size-9 place-items-center rounded-xl text-sm font-bold text-white"
          style={{ background: warna }}
        >
          {klaster.id}
        </span>
        <h3 className="font-semibold">Klaster {klaster.id}</h3>
        <span className="badge badge-ghost badge-sm">{klaster.jumlah.toLocaleString("id-ID")} tweet</span>
        {laporanTinggi && <span className="badge badge-success badge-sm">banyak laporan</span>}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-base-content/60">Tweet yang berupa laporan</span>
          <span className="font-semibold">{persen(klaster.pct_laporan)}</span>
        </div>
        <progress
          className={`progress mt-1.5 ${laporanTinggi ? "progress-success" : "progress-neutral"}`}
          value={klaster.pct_laporan}
          max={100}
          aria-label={`Persentase laporan klaster ${klaster.id}`}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {klaster.kata_kunci.split(",").map((k) => (
          <span key={k} className="badge badge-outline badge-sm">
            {k.trim()}
          </span>
        ))}
      </div>

      <p className="text-xs text-base-content/60">
        {sumber === "laporan"
          ? "Ringkasan dibuat dari tweet yang diprediksi laporan."
          : "Klaster hampir tanpa laporan; ringkasan dibuat dari semua tweet."}
      </p>

      <ol className="flex flex-1 flex-col gap-2">
        {klaster.ringkasan.map((r, i) => {
          const teks = hapusUrl(r.text);
          return (
            <li key={i} className="flex flex-1 flex-col rounded-2xl bg-base-200/70 p-3.5">
              <p className="prosa line-clamp-5 text-sm leading-snug" title={teks}>
                {teks}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-x-2 pt-2 text-xs text-base-content/60">
                <span>{tanggal(r.waktu)}</span>
                <span aria-hidden>·</span>
                <span>p(laporan) {desimal(r.p_laporan, 3)}</span>
                <span className="ml-auto font-mono">skor {r.skor.toFixed(4)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
