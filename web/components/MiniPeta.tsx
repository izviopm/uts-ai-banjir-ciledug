"use client";

import { memo } from "react";
import type { Hasil, TitikBanjir, TempatAman } from "@/lib/tipe";
import { km, ribuan } from "@/lib/format";

export const LEBAR_PETA = 360;
export const TINGGI_PETA = 280;

type Props = {
  hasil: Hasil;
  nodes: [number, number][];
  proyeksi: (p: [number, number]) => [number, number];
  radiusPx: (meter: number) => number;
  jalanD: string;
  titikBanjir: TitikBanjir[];
  tempatAman: TempatAman[];
  progres: number;
  algoritma: string;
  skenario: "normal" | "banjir";
  terbaik: boolean;
};

const W = LEBAR_PETA;
const H = TINGGI_PETA;

function MiniPetaAsli({
  hasil,
  nodes,
  proyeksi,
  radiusPx,
  jalanD,
  titikBanjir,
  tempatAman,
  progres,
  algoritma,
  skenario,
  terbaik,
}: Props) {
  const terlihat = Math.floor(hasil.jejak.length * Math.min(1, Math.max(0, progres)));
  const langkah = Math.max(1, Math.ceil(hasil.jejak.length / 500));
  const jejakTampil = hasil.jejak.slice(0, terlihat).filter((_, i) => i % langkah === 0);
  const path = hasil.path.map((n) => proyeksi(nodes[n]));
  const awal = path[0];
  const akhir = path[path.length - 1];
  const tujuan = tempatAman.find((s) => hasil.path.length && s.node === hasil.path[hasil.path.length - 1]);
  const selesai = progres >= 1;
  const dekat = awal && akhir ? Math.hypot(awal[0] - akhir[0], awal[1] - akhir[1]) < 60 : false;

  return (
    <figure className={`kartu overflow-hidden p-3 ${terbaik ? "!border-success/60" : ""}`}>
      <figcaption className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
        <span className="text-base font-semibold">{algoritma}</span>
        {terbaik && <span className="badge badge-success badge-sm">terpendek &amp; paling hemat</span>}
        <span className="ml-auto text-xs text-base-content/65">
          {ribuan(hasil.expanded)} diperiksa · {km(hasil.jarak_m)}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full rounded-2xl bg-base-200"
        role="img"
        aria-label={`Animasi ${algoritma}: ${ribuan(hasil.expanded)} persimpangan diperiksa, rute ${km(hasil.jarak_m)}`}
      >
        <path
          d={jalanD}
          fill="none"
          strokeWidth={0.8}
          strokeLinecap="round"
          style={{ stroke: "color-mix(in oklab, var(--color-base-content) 24%, transparent)" }}
        />
        {skenario === "banjir" &&
          titikBanjir.map((f) => {
            const [x, y] = proyeksi([f.lat, f.lon]);
            return (
              <circle
                key={f.node}
                cx={x}
                cy={y}
                r={Math.max(4, radiusPx(f.radius_m))}
                fill="#3b82f6"
                fillOpacity={0.18}
                stroke="#2563eb"
                strokeWidth={0.8}
              />
            );
          })}
        {tempatAman.map((s, i) => {
          const [x, y] = proyeksi([s.lat, s.lon]);
          return <circle key={`${s.node}-${i}`} cx={x} cy={y} r={2.6} fill="#16a34a" opacity={0.7} />;
        })}
        {jejakTampil.map((n, i) => {
          const [x, y] = proyeksi(nodes[n]);
          return <circle key={i} cx={x} cy={y} r={1.9} fill="#f97316" opacity={0.85} />;
        })}
        {selesai && path.length > 1 && (
          <polyline
            points={path.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="#dc2626"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="rute-gambar"
          />
        )}
        {awal && (
          <>
            <circle cx={awal[0]} cy={awal[1]} r={5} fill="#b91c1c" stroke="#fff" strokeWidth={1.5} />
            <text
              x={awal[0] + 8}
              y={dekat ? awal[1] + 18 : awal[1] - 8}
              className="label-peta"
            >
              Mulai
            </text>
          </>
        )}
        {akhir && (
          <>
            <circle cx={akhir[0]} cy={akhir[1]} r={5.5} fill="#15803d" stroke="#fff" strokeWidth={1.5} />
            {tujuan && (
              <text x={Math.min(akhir[0] + 8, W - 4)} y={dekat ? akhir[1] - 10 : akhir[1] + 16} textAnchor={akhir[0] > W * 0.6 ? "end" : "start"} className="label-peta">
                {tujuan.name.length > 26 ? `${tujuan.name.slice(0, 25)}…` : tujuan.name}
              </text>
            )}
          </>
        )}
      </svg>
    </figure>
  );
}

const MiniPeta = memo(MiniPetaAsli);
export default MiniPeta;
