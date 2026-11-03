"use client";

import { useEffect, useMemo, useState } from "react";
import MiniPeta, { LEBAR_PETA, TINGGI_PETA } from "./MiniPeta";
import type { GrafSiap } from "@/lib/graf";
import type { Hasil } from "@/lib/tipe";

type Props = {
  graf: GrafSiap;
  banding: Hasil[];
  skenario: "normal" | "banjir";
  kecepatan: "lambat" | "sedang" | "cepat";
  jeda: boolean;
  kurangiGerak: boolean;
  /** Berubah tiap kali pengguna menekan "Ulang animasi". */
  kunci: number;
};

const PAD = 14;

/**
 * Empat peta skematik berdampingan. Semuanya memakai satu bingkai yang sama (zoom ke daerah yang
 * benar-benar dijelajahi), supaya ukuran penjelajahan antaralgoritma bisa dibandingkan langsung.
 */
export default function BandingGrid({ graf, banding, skenario, kecepatan, jeda, kurangiGerak, kunci }: Props) {
  const [progres, setProgres] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgres(0);
  }, [kunci, banding]);

  useEffect(() => {
    if (kurangiGerak || jeda) return;
    const langkah = kecepatan === "lambat" ? 0.018 : kecepatan === "cepat" ? 0.07 : 0.035;
    const id = window.setInterval(() => {
      setProgres((p) => {
        const baru = Math.min(1, p + langkah);
        if (baru >= 1) window.clearInterval(id);
        return baru;
      });
    }, 50);
    return () => window.clearInterval(id);
  }, [banding, kurangiGerak, kecepatan, jeda, kunci]);

  const tampilan = useMemo(() => {
    const { nodes } = graf;
    let mnLa = Infinity;
    let mxLa = -Infinity;
    let mnLo = Infinity;
    let mxLo = -Infinity;
    const tambah = (n: number) => {
      const [la, lo] = nodes[n];
      if (la < mnLa) mnLa = la;
      if (la > mxLa) mxLa = la;
      if (lo < mnLo) mnLo = lo;
      if (lo > mxLo) mxLo = lo;
    };
    for (const h of banding) {
      for (const n of h.jejak) tambah(n);
      for (const n of h.path) tambah(n);
    }
    if (!Number.isFinite(mnLa)) return null;

    // Bingkai dibuat sesuai rasio gambar dan diberi ruang di tepi.
    const kos = Math.cos((((mnLa + mxLa) / 2) * Math.PI) / 180);
    let dLa = Math.max(mxLa - mnLa, 0.0015);
    let dLo = Math.max((mxLo - mnLo) * kos, 0.0015);
    dLa *= 1.18;
    dLo *= 1.18;
    const rasio = LEBAR_PETA / TINGGI_PETA;
    if (dLo / dLa < rasio) dLo = dLa * rasio;
    else dLa = dLo / rasio;
    const pLa = (mnLa + mxLa) / 2;
    const pLo = (mnLo + mxLo) / 2;
    const la0 = pLa - dLa / 2;
    const lo0 = pLo - dLo / (2 * kos);
    const proyeksi = ([la, lo]: [number, number]): [number, number] => [
      PAD + (((lo - lo0) * kos) / dLo) * (LEBAR_PETA - PAD * 2),
      TINGGI_PETA - PAD - ((la - la0) / dLa) * (TINGGI_PETA - PAD * 2),
    ];
    const meterPerPx = (dLa * 111_320) / (TINGGI_PETA - PAD * 2);
    const dalam = (la: number, lo: number) =>
      la >= la0 && la <= la0 + dLa && lo >= lo0 && lo <= lo0 + dLo / kos;

    // Jalan di dalam bingkai digabung jadi satu <path>: ringan walau digambar empat kali.
    let jalanD = "";
    for (const [a, b] of graf.segmenJalan) {
      if (!dalam(a[0], a[1]) && !dalam(b[0], b[1])) continue;
      const [x1, y1] = proyeksi(a);
      const [x2, y2] = proyeksi(b);
      jalanD += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }

    return {
      proyeksi,
      radiusPx: (m: number) => m / meterPerPx,
      jalanD,
      aman: graf.tempatAman.filter((s) => dalam(s.lat, s.lon)),
      banjir: graf.titikBanjir.filter((f) => dalam(f.lat, f.lon) || f.radius_m / meterPerPx > 10),
    };
  }, [graf, banding]);

  if (!tampilan) return null;
  const terbaik = banding.reduce((m, h) => (h.path.length && h.expanded < m ? h.expanded : m), Infinity);

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {banding.map((r) => (
          <MiniPeta
            key={r.algoritma}
            hasil={r}
            nodes={graf.nodes}
            proyeksi={tampilan.proyeksi}
            radiusPx={tampilan.radiusPx}
            jalanD={tampilan.jalanD}
            titikBanjir={tampilan.banjir}
            tempatAman={tampilan.aman}
            progres={kurangiGerak ? 1 : progres}
            algoritma={r.algoritma}
            skenario={skenario}
            terbaik={r.algoritma === "A*" && r.expanded === terbaik}
          />
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-base-content/70" aria-label="Keterangan simbol">
        <li className="flex items-center gap-1.5"><i className="size-3 rounded-full bg-[#b91c1c]" /> titik awal</li>
        <li className="flex items-center gap-1.5"><i className="size-3 rounded-full bg-[#15803d]" /> tempat aman tujuan</li>
        <li className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#f97316]" /> persimpangan yang diperiksa</li>
        <li className="flex items-center gap-1.5"><i className="h-1 w-5 rounded bg-[#dc2626]" /> rute akhir</li>
        {skenario === "banjir" && (
          <li className="flex items-center gap-1.5"><i className="size-3 rounded-full border border-[#2563eb] bg-[#3b82f6]/30" /> area genangan</li>
        )}
      </ul>
      <p className="text-xs leading-relaxed text-base-content/60">
        Keempat peta memakai bingkai yang sama (diperbesar ke daerah yang dijelajahi). Semakin sedikit titik
        oranye, semakin hemat algoritmanya. Garis merah baru digambar setelah semua persimpangan selesai diperiksa.
      </p>
    </div>
  );
}
