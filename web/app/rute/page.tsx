"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import TabelBenchmark from "@/components/TabelBenchmark";
import BandingGrid from "@/components/BandingGrid";
import { buatGraf, type GrafSiap } from "@/lib/graf";
import { muatGraf } from "@/lib/data";
import { ambilSearchRuns } from "@/lib/supabase";
import type { Algoritma, Hasil, SearchRun } from "@/lib/tipe";
import { km, ribuan } from "@/lib/format";

const PetaRute = dynamic(() => import("@/components/PetaRute"), {
  ssr: false,
  loading: () => <div className="skeleton h-full min-h-[360px] w-full rounded-xl" />,
});

const ALGO: Algoritma[] = ["A*", "UCS", "BFS", "DFS"];

const INFO_ALGO: Record<Algoritma | "banding", string> = {
  "A*": "Seperti UCS, tetapi memakai perkiraan jarak lurus ke tempat aman sebagai kompas. Rute terpendek dengan persimpangan yang diperiksa paling sedikit.",
  UCS: "Selalu memperluas dari titik dengan jarak tempuh terkecil. Menemukan rute terpendek, tetapi memeriksa lebih banyak persimpangan daripada A*.",
  BFS: "Menyebar rata ke segala arah dan menghitung jumlah belokan, bukan panjang jalan. Rutenya belum tentu yang terpendek.",
  DFS: "Menyusuri satu jalan sampai mentok lalu mundur. Cepat menemukan tujuan, tetapi rutenya sering berputar-putar sangat panjang.",
  banding: "Menjalankan keempat algoritma dari titik awal yang sama dan menampilkannya berdampingan.",
};

function usePrefersReducedMotion() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setV(mq.matches);
    const f = () => setV(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return v;
}

export default function HalamanRute() {
  const kurangiGerak = usePrefersReducedMotion();

  const [graf, setGraf] = useState<GrafSiap | null>(null);
  const [galat, setGalat] = useState(false);
  const [mulai, setMulai] = useState<number | null>(null);
  const [klik, setKlik] = useState<[number, number] | null>(null);
  const [skenario, setSkenario] = useState<"normal" | "banjir">("normal");
  const [algoritma, setAlgoritma] = useState<Algoritma | "banding">("A*");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [normal, setNormal] = useState<Hasil | null>(null);
  const [banding, setBanding] = useState<Hasil[] | null>(null);
  const [jejakAnim, setJejakAnim] = useState<number[] | null>(null);
  const [kunciAnimasi, setKunciAnimasi] = useState(0);
  const [kunciBanding, setKunciBanding] = useState(0);
  const [kecepatan, setKecepatan] = useState<"lambat" | "sedang" | "cepat">("sedang");
  const [jeda, setJeda] = useState(false);
  const [runs, setRuns] = useState<SearchRun[] | null | undefined>(undefined);

  const kecepatanMs = kecepatan === "lambat" ? 90 : kecepatan === "cepat" ? 18 : 45;

  useEffect(() => {
    let batal = false;
    muatGraf()
      .then((g) => {
        if (batal) return;
        const siap = buatGraf(g);
        setGraf(siap);
        const defaultTitik =
          siap.titikBanjir.find((f) => f.name.toLowerCase().includes("raden saleh")) ?? siap.titikBanjir[0];
        setMulai(defaultTitik.node);
      })
      .catch(() => {
        if (!batal) setGalat(true);
      });
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    let batal = false;
    ambilSearchRuns().then((r) => {
      if (!batal) setRuns(r);
    });
    return () => {
      batal = true;
    };
  }, []);

  const teksHasil = useMemo(() => {
    if (!hasil || !graf) return null;
    const akhir = hasil.path[hasil.path.length - 1];
    const nama = graf.tempatAman
      .filter((s) => s.node === akhir)
      .map((s) => s.name)
      .join(" / ");
    return `${hasil.algoritma} menemukan ${nama || "tempat aman"} sejauh ${km(
      hasil.jarak_m,
    )} setelah memeriksa ${ribuan(hasil.expanded)} persimpangan.`;
  }, [hasil, graf]);

  function cariRute() {
    if (!graf || mulai === null) return;
    setHasil(null);
    setNormal(null);
    setBanding(null);
    setJejakAnim(null);
    setJeda(false);
    setKunciBanding((k) => k + 1);

    if (algoritma === "banding") {
      setBanding(ALGO.map((a) => graf.cari(mulai, a, skenario === "banjir")));
    } else {
      setHasil(graf.cari(mulai, algoritma, skenario === "banjir"));
      if (skenario === "banjir") setNormal(graf.cari(mulai, algoritma, false));
    }
  }

  function putarAnimasi() {
    if (!hasil) return;
    setJeda(false);
    setJejakAnim(hasil.jejak);
    setKunciAnimasi((k) => k + 1);
  }

  function ulangBanding() {
    setJeda(false);
    setKunciBanding((k) => k + 1);
  }

  if (galat) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div role="alert" className="alert alert-error">
          Gagal memuat jaringan jalan Ciledug. Coba muat ulang halaman.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <span className="badge badge-outline">F4 · F5 · F7 · F11</span>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Rute Evakuasi Ciledug</h1>
        <p className="prosa mt-2 max-w-3xl text-base-content/70">
          Pilih titik awal dari {graf?.titikBanjir.length ?? 7} titik genangan BPBD, lalu bandingkan rute
          normal dengan rute yang menghindari ruas tergenang. Pencarian berjalan di browser memakai graf
          OpenStreetMap {graf ? `(${ribuan(graf.jumlahNode)} persimpangan, ${ribuan(graf.jumlahRusuk)} ruas)` : ""}.
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="min-w-0 space-y-4">
        {/* Peta / perbandingan */}
        <section className="min-h-[380px] overflow-hidden rounded-box border border-base-300 bg-base-100 lg:min-h-[560px]">
          {!graf || mulai === null ? (
            <div className="relative h-full min-h-[380px] p-3" role="status" aria-live="polite">
              <div className="skeleton h-full min-h-[360px] w-full rounded-[1.25rem]" />
              <p className="absolute inset-x-0 top-1/2 text-center text-sm text-base-content/60">
                Memuat jaringan jalan Ciledug (graf ±1,9 MB, hanya di halaman ini)…
              </p>
            </div>
          ) : banding ? (
            <BandingGrid
              graf={graf}
              banding={banding}
              skenario={skenario}
              kecepatan={kecepatan}
              jeda={jeda}
              kurangiGerak={kurangiGerak}
              kunci={kunciBanding}
            />
          ) : (
            <div className="h-[420px] lg:h-[560px]">
              <PetaRute
                graf={graf}
                mulai={mulai}
                skenario={skenario}
                path={hasil?.path ?? null}
                jejak={jejakAnim}
                kunciAnimasi={kunciAnimasi}
                jeda={jeda}
                kecepatanMs={kecepatanMs}
                kurangiGerak={Boolean(kurangiGerak)}
                klik={klik}
                onPilih={(lat, lon) => {
                  setMulai(graf.snap(lat, lon));
                  setKlik([lat, lon]);
                  setHasil(null);
                  setNormal(null);
                  setJejakAnim(null);
                }}
              />
            </div>
          )}
        </section>
        {graf && mulai !== null && !banding && (
          <ul
            className="kartu flex flex-wrap gap-x-5 gap-y-2 px-5 py-4 text-xs text-base-content/70"
            aria-label="Keterangan simbol peta"
          >
            <li className="flex items-center gap-1.5"><i className="size-3 rounded-full bg-[#dc2626]" /> titik awal / ujung rute</li>
            <li className="flex items-center gap-1.5"><i className="h-px w-5 bg-[#334155]" /> jalan yang bisa dilalui agen</li>
            <li className="flex items-center gap-1.5"><i className="size-3 rounded-full bg-[#3b82f6]" /> lokasi genangan</li>
            <li className="flex items-center gap-1.5"><i className="size-3 rounded-full bg-[#22c55e]" /> tempat aman (RS, klinik, polisi, dll.)</li>
            <li className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#f97316]" /> persimpangan yang diperiksa</li>
            <li className="flex items-center gap-1.5"><i className="h-1 w-5 rounded bg-[#dc2626]" /> rute hasil pencarian</li>
            {skenario === "banjir" && (
              <li className="flex items-center gap-1.5"><i className="h-1 w-5 rounded bg-[#2563eb]" /> ruas jalan tergenang</li>
            )}
          </ul>
        )}

          {algoritma === "banding" && banding && (
            <div className="kartu overflow-x-auto p-4">
              <table className="table table-xs w-full">
                <caption className="px-3 pt-3 text-left text-xs font-semibold">Ringkasan banding</caption>
                <thead>
                  <tr>
                    <th>Alg.</th>
                    <th className="text-right">Expand</th>
                    <th className="text-right">Jarak</th>
                    <th className="text-right">Langkah</th>
                  </tr>
                </thead>
                <tbody>
                  {banding.map((r) => (
                    <tr key={r.algoritma} className={r.algoritma === "A*" ? "bg-success/10 font-medium" : ""}>
                      <td>{r.algoritma}</td>
                      <td className="text-right font-mono">{ribuan(r.expanded)}</td>
                      <td className="text-right font-mono">{km(r.jarak_m)}</td>
                      <td className="text-right font-mono">{r.path.length - 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasil && !banding && (
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body gap-3">
                <h2 className="card-title text-base">Hasil {hasil.algoritma}</h2>
                <p className="sr-only" aria-live="polite">
                  {teksHasil}
                </p>
                <p className="prosa text-sm text-base-content/80">{teksHasil}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Statistik label="Jarak" nilai={km(hasil.jarak_m)} />
                  <Statistik label="Biaya (dengan penalti)" nilai={ribuan(hasil.biaya)} />
                  <Statistik label="Node diperiksa" nilai={ribuan(hasil.expanded)} />
                  <Statistik label="Langkah" nilai={ribuan(hasil.path.length - 1)} />
                </div>

                {skenario === "banjir" && normal && (
                  <div className="rounded-lg border border-info/40 bg-info/10 p-3 text-sm">
                    {hasil.jarak_m > normal.jarak_m + 1 ? (
                      <>
                        Rute memutar{" "}
                        <strong>+{km(hasil.jarak_m - normal.jarak_m)}</strong> dibanding skenario normal
                        ({km(normal.jarak_m)}) untuk menghindari genangan.
                      </>
                    ) : (
                      <>Jarak tidak bertambah: jalur terbaik pada skenario normal juga tidak melewati genangan.</>
                    )}
                  </div>
                )}

                {(algoritma === "BFS" || algoritma === "DFS") && skenario === "banjir" && (
                  <div role="note" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                    BFS dan DFS tidak memakai penalti genangan, jadi rutenya sama dengan skenario normal.
                    Ini sifat algoritmanya, bukan bug.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel kontrol */}
        <aside className="space-y-4">
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-4">
              <div>
                <h2 className="text-sm font-medium">1. Pilih titik awal</h2>
                <p className="mt-1 text-xs leading-relaxed text-base-content/65">
                  Titik awal adalah tempat rute dimulai, yaitu lokasi yang tergenang dan perlu dievakuasi.
                  Klik salah satu dari {graf?.titikBanjir.length ?? 7} lokasi genangan yang pernah diberitakan di
                  bawah ini, atau klik langsung di peta untuk memilih titik lain.
                </p>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Titik awal">
                  {graf?.titikBanjir.map((f) => {
                    const aktif = mulai === f.node;
                    return (
                      <button
                        key={f.node}
                        type="button"
                        aria-pressed={aktif}
                        className={`rounded-full border px-3 py-1.5 text-left text-xs leading-tight transition ${
                          aktif
                            ? "border-primary bg-primary text-primary-content"
                            : "border-base-300 bg-base-100 hover:border-primary/60"
                        }`}
                        onClick={() => {
                          setMulai(f.node);
                          setKlik(null);
                          setHasil(null);
                          setNormal(null);
                          setBanding(null);
                          setJejakAnim(null);
                        }}
                      >
                        {f.name}
                      </button>
                    );
                  }) ?? <div className="skeleton h-16 w-full" />}
                </div>
                {graf && mulai !== null && (
                  <p className="mt-3 rounded-2xl bg-base-200/70 p-3 text-xs leading-relaxed text-base-content/70">
                    {(() => {
                      const f = graf.titikBanjir.find((t) => t.node === mulai);
                      return f ? (
                        <>
                          <strong className="text-base-content">{f.name}</strong>: genangan sekitar radius{" "}
                          {f.radius_m} m ·{" "}
                          <a href={f.source_url} target="_blank" rel="noreferrer" className="link link-primary">
                            sumber berita
                          </a>
                        </>
                      ) : (
                        <>Titik yang Anda klik di peta. Rute dimulai dari persimpangan jalan terdekat (lingkaran putih di ujung garis putus-putus).</>
                      );
                    })()}
                  </p>
                )}
              </div>

              <fieldset>
                <legend className="mb-1 text-sm font-medium">2. Pilih skenario</legend>
                <div className="join w-full">
                  {(["normal", "banjir"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn join-item flex-1 ${skenario === s ? "btn-primary" : "btn-outline"}`}
                      aria-pressed={skenario === s}
                      onClick={() => {
                        setSkenario(s);
                        setHasil(null);
                        setBanding(null);
                        setJejakAnim(null);
                      }}
                    >
                      {s === "normal" ? "Normal" : "Banjir"}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-base-content/65">
                  {skenario === "normal"
                    ? "Normal: semua jalan dianggap bisa dilewati, termasuk yang pernah tergenang."
                    : "Banjir: ruas jalan yang tergenang (garis biru di peta) diberi biaya 20× lipat, sehingga rute memilih memutar."}
                </p>
              </fieldset>

              <fieldset>
                <legend className="mb-1 text-sm font-medium">3. Pilih algoritma pencari rute</legend>
                <div className="flex flex-wrap gap-2">
                  {ALGO.map((a) => (
                    <label
                      key={a}
                      className={`btn btn-sm ${algoritma === a ? "btn-primary" : "btn-outline"}`}
                    >
                      <input
                        type="radio"
                        name="algoritma"
                        className="sr-only"
                        value={a}
                        checked={algoritma === a}
                        onChange={() => {
                          setAlgoritma(a);
                          setBanding(null);
                          setHasil(null);
                        }}
                      />
                      {a}
                    </label>
                  ))}
                  <label
                    className={`btn btn-sm ${algoritma === "banding" ? "btn-primary" : "btn-outline"}`}
                  >
                    <input
                      type="radio"
                      name="algoritma"
                      className="sr-only"
                      value="banding"
                      checked={algoritma === "banding"}
                      onChange={() => {
                        setAlgoritma("banding");
                        setHasil(null);
                        setBanding(null);
                      }}
                    />
                    Bandingkan semua
                  </label>
                </div>
              <p className="mt-2 rounded-2xl bg-base-200/70 p-3 text-xs leading-relaxed text-base-content/70">
                  <strong className="text-base-content">{algoritma === "banding" ? "Bandingkan semua" : algoritma}:</strong>{" "}
                  {INFO_ALGO[algoritma]}
                </p>
              </fieldset>

              <fieldset>
                <legend className="mb-1 text-sm font-medium">4. Cari dan putar animasi</legend>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={cariRute}
                    disabled={!graf}
                  >
                    Cari rute
                  </button>
                  {algoritma !== "banding" && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={putarAnimasi}
                      disabled={!hasil}
                    >
                      {jejakAnim ? "Ulang" : "Putar animasi"}
                    </button>
                  )}
          {algoritma === "banding" && banding && (
                    <button type="button" className="btn btn-outline" onClick={ulangBanding}>
                      Ulang animasi
                    </button>
                  )}
                  {(algoritma === "banding" ? Boolean(banding) : Boolean(jejakAnim)) && (
                    <button
                      type="button"
                      className="btn btn-ghost border-base-300"
                      onClick={() => setJeda((v) => !v)}
                      aria-pressed={jeda}
                    >
                      {jeda ? "Lanjut" : "Jeda"}
                    </button>
                  )}
                </div>
                <label htmlFor="kecepatan" className="mt-3 block text-xs text-base-content/60">
                  Kecepatan animasi
                </label>
                <select
                  id="kecepatan"
                  className="select select-bordered select-sm mt-1 w-full"
                  value={kecepatan}
                  onChange={(e) => setKecepatan(e.target.value as typeof kecepatan)}
                >
                  <option value="lambat">Lambat</option>
                  <option value="sedang">Sedang</option>
                  <option value="cepat">Cepat</option>
                </select>
                <p className="mt-1 text-xs text-base-content/55">
                  Kecepatan berlaku untuk animasi peta dan perbandingan empat algoritma.
                </p>
              </fieldset>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Benchmark pencarian</h2>
        <p className="mt-1 max-w-3xl text-sm text-base-content/60">
          Dibandingkan pada titik dan skenario yang sama. A* memakai heuristik, UCS tidak; BFS dan DFS
          tidak memperhitungkan biaya genangan.
        </p>
        <div className="mt-4">
          {runs === undefined ? (
            <div className="skeleton h-48 w-full" />
          ) : (
            <TabelBenchmark runs={runs} />
          )}
        </div>
      </section>
    </div>
  );
}

function Statistik({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-lg bg-base-200/60 p-2.5">
      <p className="text-xs text-base-content/55">{label}</p>
      <p className="font-mono text-base font-semibold">{nilai}</p>
    </div>
  );
}
