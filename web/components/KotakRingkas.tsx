"use client";

import { useEffect, useMemo, useState } from "react";
import { muatPreprocessing, muatStem } from "@/lib/data";
import { buatAturan, preprocess, type AturanTeks } from "@/lib/teks";
import { hybridTfidf } from "@/lib/hybridTfidf";
import { desimal } from "@/lib/format";

type Hasil = {
  baris: string[];
  bersih: string[];
  terpilih: number[];
  skor: number[];
};

type Props = {
  contoh: string[];
  parameter: { n: number; ambang: number; batas_mirip: number };
};

export default function KotakRingkas({ contoh, parameter }: Props) {
  const [teks, setTeks] = useState("");
  const [aturan, setAturan] = useState<AturanTeks | null>(null);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [urut, setUrut] = useState<"skor" | "baris">("skor");

  useEffect(() => {
    let batal = false;
    Promise.all([muatPreprocessing(), muatStem()])
      .then(([pre, stem]) => {
        if (!batal) setAturan(buatAturan(pre, stem));
      })
      .catch(() => {
        if (!batal) setGalat("Gagal memuat aturan preprocessing.");
      });
    return () => {
      batal = true;
    };
  }, []);

  function isiContoh() {
    setTeks(contoh.slice(0, 10).join("\n"));
    setHasil(null);
    setGalat(null);
  }

  function ringkas(e: React.FormEvent) {
    e.preventDefault();
    if (!aturan) return;
    const baris = teks
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (baris.length < 5) {
      setGalat("Masukkan minimal 5 baris tidak kosong (satu tweet per baris).");
      setHasil(null);
      return;
    }

    const bersih = baris.map((b) => preprocess(b, aturan));
    const { terpilih, skor } = hybridTfidf(bersih, {
      n: parameter.n,
      ambang: parameter.ambang,
      batasMirip: parameter.batas_mirip,
    });
    setGalat(null);
    setHasil({ baris, bersih, terpilih, skor });
  }

  const urutan = useMemo(() => {
    if (!hasil) return [];
    return hasil.baris
      .map((_, i) => i)
      .sort((a, b) =>
        urut === "skor" ? hasil.skor[b] - hasil.skor[a] || a - b : a - b,
      );
  }, [hasil, urut]);

  return (
    <div className="space-y-6">
    <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
      <form onSubmit={ringkas} className="flex flex-col gap-3">
        <label htmlFor="teks-ringkas" className="label p-0 text-sm font-medium">
          Tempel tweet — satu tweet per baris
        </label>
        <textarea
          id="teks-ringkas"
          className="textarea min-h-64 w-full flex-1 resize-none rounded-2xl font-mono text-xs leading-relaxed lg:min-h-96"
          value={teks}
          onChange={(e) => {
            setTeks(e.target.value);
            setHasil(null);
          }}
          placeholder={`Contoh:\nBanjir 50 cm di Jl. HOS Cokroaminoto Ciledug, motor mogok\nAir mulai surut di Perumahan Ciledug Indah\n...`}
          aria-describedby="batas-ringkas"
        />
        <p id="batas-ringkas" className="text-xs text-base-content/55">
          Minimal 5 baris. Setiap baris diproses dengan aturan yang sama seperti notebook Python.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={!aturan}>
            {aturan ? "Ringkas" : "Memuat aturan…"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={isiContoh}>
            Isi contoh (10 tweet)
          </button>
        </div>
        {galat && (
          <p role="alert" className="text-sm text-error">
            {galat}
          </p>
        )}
      </form>

      <div aria-live="polite" className="flex min-w-0 flex-col gap-4">
        {!hasil ? (
          <div className="grid flex-1 min-h-40 place-items-center rounded-box border border-dashed border-base-300 p-6 text-center text-sm text-base-content/50">
            Hasil ringkasan akan muncul di sini: 3 baris terpilih beserta skor semua baris.
          </div>
        ) : (
          <>
            <div className="rounded-box border border-success/40 bg-success/10 p-5">
              <p className="text-sm font-medium">
                {hasil.terpilih.length} baris terpilih dari {hasil.baris.length} baris
              </p>
              <ol className="mt-2 space-y-2">
                {hasil.terpilih.map((i, n) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="badge badge-success badge-sm mt-0.5">{n + 1}</span>
                    <span className="prosa">{hasil.baris[i]}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="overflow-x-auto rounded-box border border-base-300">
              <table className="table table-sm w-full table-fixed">
                <caption className="sr-only">Skor Hybrid TF-IDF setiap baris</caption>
                <thead>
                  <tr>
                    <th className="w-10">#</th>
                    <th>Baris</th>
                    <th className="w-28 text-right">
                      <button
                        type="button"
                        className="link link-hover"
                        onClick={() => setUrut(urut === "skor" ? "baris" : "skor")}
                      >
                        Skor {urut === "skor" ? "↓" : ""}
                      </button>
                    </th>
                    <th className="w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {urutan.map((i) => (
                    <tr key={i} className={hasil.terpilih.includes(i) ? "bg-success/10" : ""}>
                      <td className="font-mono">{i + 1}</td>
                      <td className="truncate" title={hasil.baris[i]}>
                        {hasil.baris[i]}
                      </td>
                      <td className="text-right font-mono">{desimal(hasil.skor[i], 6)}</td>
                      <td>
                        {hasil.terpilih.includes(i) ? (
                          <span className="badge badge-success badge-xs">dipilih</span>
                        ) : (
                          <span className="text-base-content/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>
      </div>

      {hasil && (
        <details className="collapse-arrow collapse rounded-box border border-base-300">
              <summary className="collapse-title text-sm font-medium">Lihat teks setelah preprocessing</summary>
              <div className="collapse-content">
                <ol className="max-h-72 space-y-1 overflow-y-auto font-mono text-xs text-base-content/70">
                  {hasil.bersih.map((b, i) => (
                    <li key={i}>
                      <span className="text-base-content/40">{i + 1}.</span> {b || "(kosong)"}
                    </li>
                  ))}
                </ol>
              </div>
        </details>
      )}
    </div>
  );
}
