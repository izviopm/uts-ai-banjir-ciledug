"use client";

import { useEffect, useMemo, useState } from "react";
import KartuKlaster from "@/components/KartuKlaster";
import KotakRingkas from "@/components/KotakRingkas";
import SebaranKlaster from "@/components/SebaranKlaster";
import TabelRouge from "@/components/TabelRouge";
import { hapusUrl, muatKlaster } from "@/lib/data";
import type { KlasterRingkasan } from "@/lib/tipe";

export default function HalamanKlaster() {
  const [data, setData] = useState<KlasterRingkasan | null>(null);
  const [galat, setGalat] = useState(false);

  useEffect(() => {
    let batal = false;
    muatKlaster()
      .then((d) => {
        if (!batal) setData(d);
      })
      .catch(() => {
        if (!batal) setGalat(true);
      });
    return () => {
      batal = true;
    };
  }, []);

  const contoh = useMemo(() => {
    if (!data) return [];
    const semua = data.klaster.flatMap((k) => k.ringkasan.map((r) => hapusUrl(r.text)));
    return [...new Set(semua)];
  }, [data]);

  if (galat) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div role="alert" className="alert alert-error">
          Gagal memuat data klaster. Coba muat ulang halaman.
        </div>
      </div>
    );
  }

  if (!data) return <SkeletonKlaster />;

  const totalTweet = data.klaster.reduce((a, k) => a + k.jumlah, 0);
  const tinggi = data.klaster.filter((k) => k.pct_laporan >= 30).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <span className="badge badge-outline">F2 · F3 · F8</span>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Klaster &amp; Ringkasan</h1>
        <p className="prosa mt-2 max-w-3xl text-base-content/70">
          {totalTweet.toLocaleString("id-ID")} tweet Jabodetabek dikelompokkan menjadi {data.k} topik dengan
          TF-IDF + LSA + K-Means, lalu tiap topik diringkas memakai Hybrid TF-IDF. {tinggi} klaster memiliki
          proporsi laporan di atas 30%.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href="#sebaran" className="btn btn-ghost btn-xs border-base-300">Sebaran</a>
          <a href="#daftar" className="btn btn-ghost btn-xs border-base-300">Daftar klaster</a>
          <a href="#ringkas" className="btn btn-ghost btn-xs border-base-300">Coba ringkas sendiri</a>
          <a href="#rouge" className="btn btn-ghost btn-xs border-base-300">Evaluasi ROUGE</a>
        </div>
      </header>

      <section id="sebaran" className="mt-8 scroll-mt-20">
        <h2 className="text-lg font-semibold">Sebaran 1.500 tweet</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Setiap titik satu tweet. Klik legenda untuk menyorot satu klaster; nomor klaster tetap menjadi
          pembeda utama, bukan warna saja.
        </p>
        <div className="mt-4">
          <SebaranKlaster titik={data.titik} ids={data.klaster.map((k) => k.id)} />
        </div>
      </section>

      <section id="daftar" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-semibold">Daftar klaster</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Diurutkan dari proporsi laporan tertinggi. Kartu beraksen hijau berisi paling banyak laporan nyata.
        </p>
        <div className="mt-4 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.klaster.map((k) => (
            <KartuKlaster key={k.id} klaster={k} />
          ))}
        </div>
      </section>

      <section id="ringkas" className="mt-10 scroll-mt-20 rounded-box border border-base-300 bg-base-200/30 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Coba ringkas sendiri</h2>
        <p className="prosa mt-1 max-w-3xl text-sm text-base-content/70">
          Tempel minimal 5 tweet. Agen akan memilih {data.hybrid_tfidf.n} baris paling representatif dengan
          Hybrid TF-IDF, lalu membuang baris yang terlalu mirip (cosine &gt; {data.hybrid_tfidf.batas_mirip}).
          Perhitungan berjalan di browser ini.
        </p>
        <div className="mt-4">
          <KotakRingkas
            contoh={contoh}
            parameter={{
              n: data.hybrid_tfidf.n,
              ambang: data.hybrid_tfidf.ambang,
              batas_mirip: data.hybrid_tfidf.batas_mirip,
            }}
          />
        </div>
      </section>

      <section id="rouge" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-semibold">Evaluasi ROUGE</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Ringkasan dibandingkan dengan acuan dua anotator pada 10 set, masing-masing 25 tweet.
        </p>
        <div className="mt-4">
          <TabelRouge />
        </div>
      </section>
    </div>
  );
}

function SkeletonKlaster() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-4 w-full max-w-2xl" />
      <div className="skeleton h-80 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-64 w-full" />
        ))}
      </div>
      <p className="text-center text-sm text-base-content/50">Memuat model klaster…</p>
    </div>
  );
}
