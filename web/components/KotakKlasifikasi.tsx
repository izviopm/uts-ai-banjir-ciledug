"use client";

import { useEffect, useState } from "react";
import { muatNB, muatPreprocessing, muatStem } from "@/lib/data";
import { buatNB, type ModelNB } from "@/lib/naiveBayes";
import { buatAturan, preprocess, type AturanTeks } from "@/lib/teks";
import { desimal } from "@/lib/format";

const CONTOH = [
  "Banjir setinggi betis orang dewasa di Jl. H. Kana II, Peninggilan Selatan, Ciledug. Mohon hindari jalan ini.",
  "Gak banjir kok, cuma hujan doang. Santai aja, besok juga surut sendiri.",
  "RT @bpbd_kotatanggerang: air 50 cm di Jl. Raden Saleh Raya, warga mulai mengungsi ke balai warga.",
];

type Siap = { aturan: AturanTeks; nb: ModelNB };

export default function KotakKlasifikasi() {
  const [siap, setSiap] = useState<Siap | null>(null);
  const [teks, setTeks] = useState(CONTOH[0]);
  const [hasil, setHasil] = useState<{ p: number; label: string; bersih: string } | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    Promise.all([muatPreprocessing(), muatStem(), muatNB()])
      .then(([pre, stem, nb]) => {
        if (batal) return;
        setSiap({ aturan: buatAturan(pre, stem), nb: buatNB(nb) });
      })
      .catch(() => {
        if (!batal) setGalat("Gagal memuat model Naive Bayes.");
      });
    return () => {
      batal = true;
    };
  }, []);

  function klasifikasi(e: React.FormEvent) {
    e.preventDefault();
    if (!siap) return;
    const bersih = preprocess(teks, siap.aturan);
    const r = siap.nb.prediksi(bersih);
    setHasil({ p: r.p, label: r.label, bersih });
    setGalat(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={klasifikasi} className="space-y-3">
        <label htmlFor="tweet-uji" className="label p-0 text-sm font-medium">
          Ketik satu tweet
        </label>
        <textarea
          id="tweet-uji"
          className="textarea h-32 w-full text-sm"
          value={teks}
          onChange={(e) => {
            setTeks(e.target.value);
            setHasil(null);
          }}
          placeholder="Contoh: Banjir 50 cm di Jl. HOS Cokroaminoto Ciledug, motor mogok"
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={!siap || !teks.trim()}>
            {siap ? "Klasifikasi" : "Memuat model…"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONTOH.map((c, i) => (
            <button
              key={i}
              type="button"
              className="btn btn-ghost btn-xs border-base-300"
              onClick={() => {
                setTeks(c);
                setHasil(null);
              }}
            >
              Contoh {i + 1}
            </button>
          ))}
        </div>
        {galat && (
          <p role="alert" className="text-sm text-error">
            {galat}
          </p>
        )}
      </form>

      <div aria-live="polite" className="space-y-3">
        {!hasil ? (
          <div className="grid h-full min-h-32 place-items-center rounded-box border border-dashed border-base-300 p-6 text-center text-sm text-base-content/50">
            Hasil klasifikasi dan teks hasil preprocessing akan muncul di sini.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`badge badge-lg ${hasil.label === "laporan" ? "badge-success" : "badge-ghost"}`}>
                {hasil.label === "laporan" ? "Laporan" : "Bukan laporan"}
              </span>
              <span className="text-sm text-base-content/60">
                p(laporan) = <span className="font-mono font-semibold">{desimal(hasil.p, 4)}</span>
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-base-content/55">
                <span>0,0 · bukan laporan</span>
                <span>0,5 · ambang</span>
                <span>1,0 · laporan</span>
              </div>
              <progress
                className={`progress mt-1 w-full ${hasil.p >= 0.5 ? "progress-success" : "progress-neutral"}`}
                value={hasil.p}
                max={1}
                aria-label="Probabilitas tweet berupa laporan"
              />
            </div>
            <div className="rounded-box border border-base-300 bg-base-200/50 p-3">
              <p className="text-xs font-medium text-base-content/60">Teks setelah preprocessing</p>
              <p className="mt-1 break-words font-mono text-xs leading-relaxed">
                {hasil.bersih || "(tidak ada kata yang tersisa)"}
              </p>
            </div>
            {hasil.bersih === "" && (
              <p className="text-xs text-warning">
                Tidak ada fitur yang dikenal model, sehingga probabilitas dipaksa 0 (bukan laporan).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
