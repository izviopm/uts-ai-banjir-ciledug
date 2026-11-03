import Link from "next/link";
import klasterJson from "@/public/model/klaster_ringkasan.json";
import nbJson from "@/public/model/naive_bayes.json";
import angka from "@/data/angka.json";
import AngkaJalan from "@/components/AngkaJalan";
import Cincin from "@/components/Cincin";
import Muncul from "@/components/Muncul";
import { NAMA_MODEL, desimal, persen, ribuan } from "@/lib/format";

const REPO = "https://github.com/izviopm/uts-ai-banjir-ciledug";
const NOTEBOOK = [
  { n: "01", nama: "EDA & Preprocessing", file: "01_eda_preprocessing.ipynb" },
  { n: "02", nama: "Klasifikasi", file: "02_klasifikasi.ipynb" },
  { n: "03", nama: "Searching Rute", file: "03_searching_rute.ipynb" },
  { n: "04", nama: "Klasterisasi & Peringkasan", file: "04_klasterisasi_peringkasan.ipynb" },
];

const LANGKAH = [
  { no: "1", judul: "Klasifikasi", isi: "Pisahkan laporan kejadian dari opini dan candaan.", href: "/klasifikasi" },
  { no: "2", judul: "Klasterisasi", isi: "Kelompokkan 3.390 tweet menjadi 11 topik.", href: "/klaster" },
  { no: "3", judul: "Peringkasan", isi: "Ringkas tiap klaster jadi 3 tweet terpilih.", href: "/klaster#ringkas" },
  { no: "4", judul: "Rute Evakuasi", isi: "Cari jalan ke tempat aman, hindari genangan.", href: "/rute" },
];

const MODEL = ["naive_bayes", "knn", "decision_tree"] as const;

export default function Beranda() {
  const korpus = angka.nb4.korpus;
  const berlabel = angka.nb1.total;
  const k = klasterJson.k;
  const f1 = nbJson.metrics.f1;
  const akurasi = nbJson.metrics.accuracy;
  const expandedA = angka.nb3.rata_titik_banjir["banjir|A*"].expanded;
  const expandedU = angka.nb3.rata_titik_banjir["banjir|UCS"].expanded;
  const rasio = expandedU / expandedA;
  const titikBanjir = angka.nb3.banjir.length;
  const laporanPersen = (angka.nb1.laporan / angka.nb1.total) * 100;
  const rouge = Object.entries(angka.nb4.rouge) as [string, { R1: number; R2: number; RL: number }][];
  const rougeMaks = Math.max(...rouge.map(([, v]) => v.R1));
  const f1Model = MODEL.map((m) => ({ m, f1: angka.nb2[m].f1 }));

  return (
    <div className="mx-auto max-w-7xl px-3 pb-12 sm:px-5">
      {/* Hero */}
      <section className="flex flex-col gap-6 py-10 sm:py-14 lg:flex-row lg:items-end lg:justify-between">
        <Muncul>
          <span className="pil">UTS Kecerdasan Artifisial · Tema D</span>
          <h1 className="prosa mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Cari rute aman saat banjir di Ciledug.
            <span className="mt-1 block text-base-content/40">
              Dari {ribuan(korpus)} tweet yang dikelompokkan dan diringkas.
            </span>
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/rute" className="btn btn-primary btn-lg rounded-full px-8">
              Cari rute aman <span aria-hidden="true">→</span>
            </Link>
            <Link href="/klaster" className="btn btn-lg rounded-full border-base-300 bg-base-100">
              Lihat klaster topik
            </Link>
          </div>
        </Muncul>
        <Muncul delay={0.08} className="max-w-md">
          <p className="prosa text-base text-base-content/70">
            Agen ini menyaring laporan kejadian dari opini dan candaan, mengelompokkannya, meringkas situasi
            per topik, lalu mencari rute evakuasi yang menghindari genangan di Ciledug.
          </p>
          <p className="mt-3 text-xs text-base-content/55">
            Izvio Prijaya Mumin (2611600087) · Fatah Idzhar Hamdi (2611600129) · Dr. Indra, S.Kom, M.T.I
          </p>
        </Muncul>
      </section>

      {/* Bento */}
      <section aria-label="Angka kunci" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 [&>*]:min-w-0">
        <Muncul className="kartu flex flex-wrap items-center gap-5 p-6 lg:col-span-4">
          <Cincin nilai={f1} keterangan={desimal(f1, 3)} judul="F1 Naive Bayes" />
          <div>
            <p className="text-sm font-medium">Klasifikasi laporan banjir</p>
            <p className="mt-1 text-sm text-base-content/65">
              Akurasi {desimal(akurasi, 3)} pada {angka.nb1.uji} tweet uji. Model ini berjalan penuh di browser.
            </p>
            <Link href="/klasifikasi" className="pil mt-3">
              Coba klasifikasi
            </Link>
          </div>
        </Muncul>

        <div className="grid grid-cols-2 gap-4 lg:col-span-5">
          <Muncul delay={0.04} className="kartu p-5">
            <p className="text-sm text-base-content/60">Tweet dianalisis</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              <AngkaJalan nilai={korpus} />
            </p>
            <p className="mt-1 text-xs text-base-content/55">korpus Jabodetabek</p>
          </Muncul>
          <Muncul delay={0.08} className="kartu p-5">
            <p className="text-sm text-base-content/60">Tweet berlabel</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              <AngkaJalan nilai={berlabel} />
            </p>
            <p className="mt-1 text-xs text-base-content/55">{persen(laporanPersen)} laporan banjir</p>
          </Muncul>
          <Muncul delay={0.12} className="kartu p-5">
            <p className="text-sm text-base-content/60">Klaster topik</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              <AngkaJalan nilai={k} />
            </p>
            <p className="mt-1 text-xs text-base-content/55">K-Means + elbow</p>
          </Muncul>
          <Muncul delay={0.16} className="kartu p-5">
            <p className="text-sm text-base-content/60">Tempat aman</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              <AngkaJalan nilai={angka.nb3.aman} />
            </p>
            <p className="mt-1 text-xs text-base-content/55">{titikBanjir} titik genangan</p>
          </Muncul>
        </div>

        <Muncul delay={0.1} className="rounded-[var(--radius-box)] bg-primary p-6 text-primary-content md:col-span-2 lg:col-span-3">
          <p className="text-sm opacity-85">A* vs UCS</p>
          <p className="mt-3 text-5xl font-semibold tracking-tight">
            <AngkaJalan nilai={rasio} desimal={1} akhiran="×" />
          </p>
          <p className="mt-2 text-sm opacity-90">
            lebih sedikit persimpangan diperiksa pada skenario banjir ({titikBanjir} titik, rata-rata{" "}
            {ribuan(expandedA)} vs {ribuan(expandedU)}).
          </p>
          <Link
            href="/rute"
            className="mt-4 inline-flex rounded-full bg-base-100 px-4 py-1.5 text-sm font-medium text-base-content"
          >
            Buka peta rute →
          </Link>
        </Muncul>

        {/* Perbandingan model: gelembung konsentris */}
        <Muncul delay={0.05} className="kartu p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">F1 tiga model</h2>
            <span className="pil">uji {angka.nb1.uji}</span>
          </div>
          <ul className="mt-6 flex items-end justify-around gap-1" aria-label="F1 per model">
            {f1Model.map(({ m, f1: v }, i) => {
              const d = Math.round(48 + 72 * ((v - 0.4) / (f1Model[0].f1 - 0.4)));
              return (
                <li key={m} className="flex min-w-0 flex-col items-center gap-2">
                  <span
                    className="grid place-items-center rounded-full bg-accent text-sm font-semibold text-accent-content"
                    style={{ width: d, height: d, opacity: 1 - i * 0.28 }}
                  >
                    {desimal(v, 2)}
                  </span>
                  <span className="text-center text-xs text-base-content/70">{NAMA_MODEL[m].replace("K-Nearest Neighbors", "KNN")}</span>
                </li>
              );
            })}
          </ul>
        </Muncul>

        {/* ROUGE */}
        <Muncul delay={0.1} className="kartu p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">ROUGE-1 peringkasan</h2>
            <span className="pil">10 set evaluasi</span>
          </div>
          <ul className="mt-5 space-y-4">
            {rouge.map(([nama, v]) => (
              <li key={nama}>
                <div className="flex justify-between text-sm">
                  <span>{nama}</span>
                  <span className="font-mono">{desimal(v.R1, 3)}</span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-base-200">
                  <div
                    className={`h-full rounded-full ${nama.startsWith("Hybrid") ? "bg-primary" : "bg-base-content/30"}`}
                    style={{ width: `${(v.R1 / rougeMaks) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-base-content/60">
            Selisih Hybrid TF-IDF terhadap pembanding belum signifikan secara statistik (uji Wilcoxon).
          </p>
        </Muncul>

        {/* Batas */}
        <Muncul delay={0.15} className="kartu bg-warning/10 p-6 md:col-span-2 lg:col-span-4">
          <h2 className="text-sm font-medium">Batas yang perlu diketahui</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-base-content/75">
            <li>Genangan adalah skenario historis, bukan data real-time.</li>
            <li>Tidak ada prediksi cuaca atau tinggi air.</li>
            <li>Sebagian tweet menyebut “Ciledug” di Cirebon/Garut, bukan Tangerang.</li>
            <li>Model masih sering salah pada tweet kiasan.</li>
          </ul>
          <Link href="/tentang" className="link link-primary mt-3 inline-block text-sm font-medium">
            Baca keterbatasan lengkap →
          </Link>
        </Muncul>
      </section>

      {/* Alur agen */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Alur agen dalam empat langkah</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Setiap langkah bisa dicoba langsung. Hasilnya dihitung di browser dari model hasil penelitian.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LANGKAH.map((l) => (
            <Link key={l.no} href={l.href} className="kartu group p-5 transition hover:border-primary/50">
              <span className="grid size-10 place-items-center rounded-full bg-neutral font-semibold text-neutral-content">
                {l.no}
              </span>
              <h3 className="mt-4 font-semibold">{l.judul}</h3>
              <p className="mt-1 text-sm text-base-content/70">{l.isi}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary group-hover:underline">
                Buka →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Konteks data */}
      <section className="kartu mt-10 grid gap-6 p-6 sm:p-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold">Apa yang didemokan</h2>
          <div className="mt-4 space-y-3 text-sm text-base-content/75">
            <p>
              <strong>Bagian teks</strong> dilatih pada 1.220 tweet banjir berlabel dan 3.390 tweet Jabodetabek.
              Dari korpus itu, {ribuan(korpus)} tweet dikelompokkan menjadi {k} topik, lalu tiap topik diringkas
              menjadi tiga tweet paling representatif.
            </p>
            <p>
              <strong>Bagian rute</strong> memakai jaringan jalan OpenStreetMap di sekitar Ciledug:{" "}
              {ribuan(angka.nb3.node)} persimpangan dan {ribuan(angka.nb3.ruas)} ruas jalan, dengan {titikBanjir}{" "}
              titik genangan dari pemberitaan BPBD Kota Tangerang. Ruas yang tergenang tidak ditutup, tetapi
              biayanya dikali 20 sehingga rute memutar.
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium">Notebook penelitian</h2>
          <ul className="mt-3 space-y-2">
            {NOTEBOOK.map((nb) => (
              <li key={nb.n}>
                <a
                  href={`${REPO}/blob/main/notebooks/${nb.file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-full border border-base-300 px-4 py-2 text-sm transition hover:border-primary/50"
                >
                  <span className="font-mono font-semibold text-primary">{nb.n}</span>
                  {nb.nama}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
