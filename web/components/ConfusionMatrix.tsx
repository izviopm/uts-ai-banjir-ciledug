type Props = {
  judul: string;
  matriks: number[][];
  dipilih?: boolean;
};

export default function ConfusionMatrix({ judul, matriks, dipilih }: Props) {
  if (!matriks || matriks.length !== 2) return null;
  const [[tn, fp], [fn, tp]] = matriks;
  const maks = Math.max(tn, fp, fn, tp, 1);

  const sel = (nilai: number, label: string, benar: boolean) => {
    const kuat = Math.round((nilai / maks) * 48) + 10;
    return (
      <div
        className="grid min-h-24 place-items-center rounded-2xl p-3 text-center"
        style={{ background: `color-mix(in oklab, var(--color-${benar ? "success" : "error"}) ${kuat}%, transparent)` }}
      >
        <div>
          <p className="font-mono text-2xl font-bold leading-none">{nilai}</p>
          <p className="mt-1.5 text-xs text-base-content/65">{label}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`kartu flex h-full flex-col p-5 ${dipilih ? "!border-primary/60" : ""}`}>
      <h3 className="flex items-center gap-2 font-semibold">
        {judul}
        {dipilih && <span className="badge badge-primary badge-sm">terpilih</span>}
      </h3>
      <div className="mt-4 grid flex-1 grid-cols-[4.5rem_1fr_1fr] items-stretch gap-2 text-center text-xs text-base-content/60">
        <span />
        <span className="self-end">Prediksi: bukan</span>
        <span className="self-end">Prediksi: laporan</span>

        <span className="self-center text-right">Asli: bukan</span>
        {sel(tn, "TN · benar", true)}
        {sel(fp, "FP · salah", false)}

        <span className="self-center text-right">Asli: laporan</span>
        {sel(fn, "FN · salah", false)}
        {sel(tp, "TP · benar", true)}
      </div>
    </div>
  );
}
