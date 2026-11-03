"use client";

import { useMemo, useState } from "react";
import { WARNA_KLASTER } from "@/lib/format";

type Props = {
  titik: [number, number, number][];
  ids: number[];
};

const W = 640;
const H = 440;
const PAD = 18;

export default function SebaranKlaster({ titik, ids }: Props) {
  const [sorot, setSorot] = useState<number | null>(null);

  const { titikLayar, minX, maxX } = useMemo(() => {
    let mnX = Infinity;
    let mxX = -Infinity;
    let mnY = Infinity;
    let mxY = -Infinity;
    for (const [x, y] of titik) {
      if (x < mnX) mnX = x;
      if (x > mxX) mxX = x;
      if (y < mnY) mnY = y;
      if (y > mxY) mxY = y;
    }
    const dx = mxX - mnX || 1;
    const dy = mxY - mnY || 1;
    const hasil = titik.map(([x, y, c]) => ({
      x: PAD + ((x - mnX) / dx) * (W - PAD * 2),
      y: H - PAD - ((y - mnY) / dy) * (H - PAD * 2),
      c,
    }));
    return { titikLayar: hasil, minX: mnX, maxX: mxX };
  }, [titik]);

  return (
    <div>
      <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Sebaran ${titik.length} tweet dalam proyeksi 2 dimensi, diwarnai menurut 11 klaster`}
        >
          <rect width={W} height={H} className="fill-base-100" />
          {titikLayar.map((t, i) => {
            const aktif = sorot === null || sorot === t.c;
            return (
              <circle
                key={i}
                cx={t.x}
                cy={t.y}
                r={sorot === t.c ? 3.6 : 2.4}
                fill={WARNA_KLASTER[t.c % WARNA_KLASTER.length]}
                opacity={aktif ? (sorot === t.c ? 0.95 : 0.55) : 0.08}
              >
                <title>{`Klaster ${t.c}`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-xs text-base-content/55">
        Proyeksi 2D dari 100 dimensi LSA (SVD). Jarak antartitik hanya perkiraan, bukan ukuran kemiripan
        yang presisi. Rentang sumbu: {minX.toFixed(2)} … {maxX.toFixed(2)}.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn btn-xs ${sorot === null ? "btn-neutral" : "btn-ghost border-base-300"}`}
          onClick={() => setSorot(null)}
        >
          Semua
        </button>
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            className={`btn btn-xs ${sorot === id ? "btn-neutral" : "btn-ghost border-base-300"}`}
            onClick={() => setSorot(sorot === id ? null : id)}
            aria-pressed={sorot === id}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: WARNA_KLASTER[id % WARNA_KLASTER.length] }}
            />
            Klaster {id}
          </button>
        ))}
      </div>
    </div>
  );
}
