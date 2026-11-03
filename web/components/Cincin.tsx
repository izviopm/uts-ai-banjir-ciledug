type Props = {
  /** 0–1 */
  nilai: number;
  judul: string;
  keterangan: string;
  ukuran?: number;
};

/** Cincin progres SVG murni (server component), mirip kartu "Growth rate" pada referensi. */
export default function Cincin({ nilai, judul, keterangan, ukuran = 168 }: Props) {
  const r = 70;
  const keliling = 2 * Math.PI * r;
  const isi = Math.max(0, Math.min(1, nilai)) * keliling;
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full bg-neutral text-neutral-content"
      style={{ width: ukuran, height: ukuran }}
      role="img"
      aria-label={`${judul}: ${keterangan}`}
    >
      <svg viewBox="0 0 168 168" className="absolute inset-0 size-full -rotate-90">
        <circle cx="84" cy="84" r={r} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth="9" />
        <circle
          cx="84"
          cy="84"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${isi} ${keliling}`}
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-semibold tracking-tight">{keterangan}</p>
        <p className="text-xs opacity-70">{judul}</p>
      </div>
    </div>
  );
}
