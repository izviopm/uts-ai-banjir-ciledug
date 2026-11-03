type Props = {
  nilai: number;
  desimal?: number;
  awalan?: string;
  akhiran?: string;
};

/** Angka statis berformat id-ID (server component, tanpa JS di klien). */
export default function AngkaJalan({ nilai, desimal = 0, awalan = "", akhiran = "" }: Props) {
  const teks = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  }).format(nilai);
  return (
    <span>
      {awalan}
      {teks}
      {akhiran}
    </span>
  );
}
