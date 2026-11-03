"use client";

import { useEffect, useState } from "react";
import TabelMetrik from "@/components/TabelMetrik";
import ConfusionMatrix from "@/components/ConfusionMatrix";
import KotakKlasifikasi from "@/components/KotakKlasifikasi";
import angka from "@/data/angka.json";
import { ambilMetrik } from "@/lib/supabase";
import type { MetrikModel } from "@/lib/tipe";
import { NAMA_MODEL, persen, ribuan } from "@/lib/format";

const LOKAL = Object.entries(angka.nb2).map(([model, m]) => ({ model, ...m })) as unknown as MetrikModel[];

export default function HalamanKlasifikasi() {
  const [data, setData] = useState<MetrikModel[] | null>(null);
  const [dariDb, setDariDb] = useState(false);

  useEffect(() => {
    let batal = false;
    ambilMetrik().then((d) => {
      if (batal) return;
      if (d) {
        setData(d);
        setDariDb(true);
      } else {
        setData(LOKAL);
        setDariDb(false);
      }
    });
    return () => {
      batal = true;
    };
  }, []);

  const total = angka.nb1.total;
  const laporan = angka.nb1.laporan;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <span className="badge badge-outline">F6</span>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Klasifikasi Laporan Banjir</h1>
        <p className="prosa mt-2 max-w-3xl text-base-content/70">
          Dari {ribuan(total)} tweet berlabel, {ribuan(laporan)} ({persen((laporan / total) * 100)}) merupakan
          laporan kejadian. Tiga model dibandingkan; Naive Bayes dipilih lewat cross-validation. Di bawah ini
          kamu bisa menguji tweet sendiri — perhitungan berjalan di browser.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Perbandingan model</h2>
        <div className="mt-3">
          {data ? <TabelMetrik data={data} dariDb={dariDb} /> : <div className="skeleton h-40 w-full" />}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Confusion matrix</h2>
        <p className="mt-1 text-sm text-base-content/60">
          TN/TP = benar, FP/FN = salah. Kotak lebih pekat berarti jumlah lebih besar.
        </p>
        <div className="mt-4 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((m) => (
            <ConfusionMatrix
              key={m.model}
              judul={NAMA_MODEL[m.model] ?? m.model}
              matriks={m.confusion_matrix ?? []}
              dipilih={m.model === "naive_bayes"}
            />
          )) ?? <div className="skeleton h-40 w-full" />}
        </div>
      </section>

      <section className="mt-8 rounded-box border border-base-300 bg-base-200/30 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Coba klasifikasi sendiri</h2>
        <p className="mt-1 max-w-3xl text-sm text-base-content/70">
          Tweet diproses dengan aturan yang sama seperti notebook: URL dan mention dibuang, angka menjadi
          token <code>angka</code>, slang dinormalkan, lalu di-stem. Model memakai unigram + bigram TF-IDF.
        </p>
        <div className="mt-4">
          <KotakKlasifikasi />
        </div>
      </section>

      <section className="mt-8">
        <div role="note" className="alert alert-info alert-soft items-start">
          <span>
            <strong>Catatan jujur:</strong> F1 0,61 berarti model masih sering keliru pada tweet kiasan,
            terlalu pendek, atau campuran opini dan fakta. Model dilatih pada tweet banjir umum
            Jabodetabek, bukan khusus Ciledug.
          </span>
        </div>
      </section>
    </div>
  );
}
