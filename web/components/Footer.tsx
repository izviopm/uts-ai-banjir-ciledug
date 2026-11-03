import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-200/50">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-semibold">Agen Cerdas Tanggap Banjir Ciledug</p>
          <p className="mt-1 text-base-content/70">
            UTS Kecerdasan Artifisial · Magister Ilmu Komputer · Universitas Budi Luhur
          </p>
          <p className="mt-2 text-base-content/60">
            Izvio Prijaya Mumin (2611600087) · Fatah Idzhar Hamdi (2611600129)
          </p>
        </div>
        <div>
          <p className="font-semibold">Navigasi</p>
          <ul className="mt-1 space-y-1 text-base-content/70">
            <li><Link className="link link-hover" href="/klaster">Klaster &amp; Ringkasan</Link></li>
            <li><Link className="link link-hover" href="/rute">Rute Evakuasi</Link></li>
            <li><Link className="link link-hover" href="/klasifikasi">Klasifikasi</Link></li>
            <li><Link className="link link-hover" href="/tentang">Tentang &amp; keterbatasan</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Sumber data</p>
          <p className="mt-1 text-base-content/70">
            Tweet: Ariyanto dkk. (2025), Mendeley SRL Crisis Event. Peta: OpenStreetMap contributors.
            Titik genangan: BPBD Kota Tangerang via pemberitaan.
          </p>
          <p className="mt-2 text-xs text-base-content/60">
            © OpenStreetMap contributors · Data genangan adalah skenario historis, bukan prediksi.
          </p>
        </div>
      </div>
    </footer>
  );
}
