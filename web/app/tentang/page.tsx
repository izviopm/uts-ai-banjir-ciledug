import Image from "next/image";
import angka from "@/data/angka.json";
import { ribuan } from "@/lib/format";

const TIM = [
  {
    nama: "Izvio Prijaya Mumin",
    nim: "2611600087",
    peran: "Riset & notebook Python",
    isi: "EDA, klasifikasi, searching rute, klasterisasi & peringkasan, ekspor model ke JSON.",
  },
  {
    nama: "Fatah Idzhar Hamdi",
    nim: "2611600129",
    peran: "Web demo",
    isi: "Port algoritma ke TypeScript, antarmuka Next.js, peta Leaflet, dan validasi fixtures.",
  },
];

const KETERBATASAN = [
  "Label dataset berasal dari anotasi per token (SRL) yang diturunkan ke tingkat tweet, sehingga batas laporan dan bukan laporan tidak selalu tegas.",
  "Korpus hasil sampling maksimal sekitar 14 tweet per hari, bukan seluruh percakapan Twitter.",
  "Silhouette klaster di bawah 0,1 — batas antartopik lemah, sebagian tweet masuk klaster yang tumpang tindih.",
  "Genangan dimodelkan sebagai lingkaran radius 150–300 m dan penalti biaya 20× adalah asumsi, bukan hasil kalibrasi hidrologis.",
  "Dua titik BPBD (Komplek Patal dan Jl. H. Mean) tidak ditemukan di OpenStreetMap sehingga tidak dipetakan.",
  "Sebagian tweet dari luar Jabodetabek lolos penyaringan; sebagian sebutan “Ciledug” merujuk Cirebon atau Garut.",
  "Jaringan jalan hanya untuk kendaraan, bukan jalur pejalan kaki.",
  "Peningkatan ROUGE Hybrid TF-IDF belum signifikan secara statistik pada 10 set evaluasi.",
];

export default function HalamanTentang() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <span className="badge badge-outline">F9</span>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Tentang proyek</h1>
        <p className="prosa mt-2 text-base-content/70">
          Agen cerdas tanggap banjir yang menggabungkan pemrosesan bahasa Indonesia dan pencarian rute pada
          jaringan jalan nyata. Studi kasus: Ciledug, Kota Tangerang.
        </p>
      </header>

      <section className="mt-8 flex flex-wrap items-center gap-5 rounded-box border border-base-300 bg-base-100 p-5">
        <Image
          src="/logo-blu.png"
          alt="Emblem Universitas Budi Luhur"
          width={84}
          height={84}
          className="h-20 w-20 object-contain"
        />
        <div>
          <p className="text-sm font-semibold">Universitas Budi Luhur</p>
          <p className="text-sm text-base-content/70">Magister Ilmu Komputer · Kecerdasan Artifisial</p>
          <p className="mt-1 text-sm text-base-content/70">
            Dosen pengampu: <strong>Dr. Indra, S.Kom, M.T.I</strong>
          </p>
          <p className="text-sm text-base-content/70">Tema dosen: Mesin Peringkasan &amp; Klasterisasi (Tema D)</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Tim</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TIM.map((t) => (
            <div key={t.nim} className="rounded-box border border-base-300 bg-base-100 p-4">
              <p className="font-semibold">{t.nama}</p>
              <p className="text-sm text-base-content/55">
                {t.nim} · {t.peran}
              </p>
              <p className="mt-2 text-sm text-base-content/70">{t.isi}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Data &amp; metode</h2>
        <div className="mt-3 space-y-3 text-sm text-base-content/75">
          <p>
            <strong>Tweet.</strong> Dataset anotasi SRL bencana Indonesia: Ariyanto, A. D. P., Purwitasari, D.,
            Amaliah, B., Fatichah, C., Taqiuddin, M. G., &amp; Haikal. (2025). <em>Annotated data for semantic
            role labeling of crisis events in Indonesian Tweets.</em> Data in Brief, 61, 111688.{" "}
            <a
              className="link link-primary"
              href="https://doi.org/10.1016/j.dib.2025.111688"
              target="_blank"
              rel="noreferrer"
            >
              doi:10.1016/j.dib.2025.111688
            </a>
          </p>
          <p>
            <strong>Peta.</strong> Jaringan jalan dari OpenStreetMap contributors, diambil dengan OSMnx dalam
            radius 4,5 km dari Kantor Kecamatan Ciledug: {ribuan(angka.nb3.node)} persimpangan dan{" "}
            {ribuan(angka.nb3.ruas)} ruas berarah. {ribuan(angka.nb3.ruas_genang)} ruas berada dalam radius
            genangan.
          </p>
          <p>
            <strong>Genangan.</strong> Tujuh titik dari pemberitaan BPBD Kota Tangerang. Genangan historis,
            bukan data real-time dan bukan prediksi.
          </p>
          <p>
            <strong>Metode.</strong> Klasifikasi: TF-IDF + Naive Bayes/KNN/Decision Tree. Klasterisasi: TF-IDF
            + LSA (100 dimensi) + K-Means (k = 11, elbow). Peringkasan: Hybrid TF-IDF + seleksi
            anti-redundansi. Rute: BFS, DFS, UCS, dan A* dengan heuristik haversine.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Tujuh titik genangan</h2>
        <div className="mt-3 overflow-x-auto rounded-box border border-base-300">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Lokasi</th>
                <th className="text-right">Radius</th>
                <th>Sumber</th>
              </tr>
            </thead>
            <tbody>
              {angka.nb3.banjir.map((b) => (
                <tr key={b.name}>
                  <td>{b.name}</td>
                  <td className="text-right font-mono">{b.radius} m</td>
                  <td>
                    <a href={b.sumber} target="_blank" rel="noreferrer" className="link link-primary">
                      berita
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Keterbatasan</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-base-content/75">
          {KETERBATASAN.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-box border border-base-300 bg-base-200/40 p-5">
        <h2 className="text-lg font-semibold">Tautan</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            className="btn btn-sm btn-outline"
            href="https://github.com/izviopm/uts-ai-banjir-ciledug"
            target="_blank"
            rel="noreferrer"
          >
            Repositori GitHub
          </a>
          <a
            className="btn btn-sm btn-outline"
            href="https://github.com/izviopm/uts-ai-banjir-ciledug/tree/main/notebooks"
            target="_blank"
            rel="noreferrer"
          >
            Notebook penelitian
          </a>
          <a
            className="btn btn-sm btn-outline"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </div>
      </section>
    </div>
  );
}
