// Menyusun laporan UTS (.docx) dari laporan/angka.json + gambar di laporan/gambar.
// Jalankan dari root repo: NODE_PATH=<folder node_modules berisi docx@9> node scripts/buat_laporan.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, PageBreak, TableOfContents, Footer, PageNumber, NumberFormat,
  LevelFormat, SectionType, ExternalHyperlink,
} = require("docx");

const A = JSON.parse(fs.readFileSync("laporan/angka.json", "utf8"));
const GAMBAR = "laporan/gambar";
const FONT = "Times New Roman";
const id = (x, d = 3) => x.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
const ribu = (x) => Math.round(x).toLocaleString("id-ID");
const M = A.nb2, B = A.nb3, K = A.nb4;

// ---------------------------------------------------------------- helper
function runs(teks, dasar = {}) {
  // **tebal**, *miring*
  // "{*}" = bintang literal (mis. A{*}), tidak dianggap penanda miring
  const asli = (t) => t.replaceAll("\u0001", "*");
  return teks.replaceAll("{*}", "\u0001").split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).filter(Boolean).map((s) => {
    if (s.startsWith("**")) return new TextRun({ text: asli(s.slice(2, -2)), bold: true, font: FONT, ...dasar });
    if (s.startsWith("*")) return new TextRun({ text: asli(s.slice(1, -1)), italics: true, font: FONT, ...dasar });
    return new TextRun({ text: asli(s), font: FONT, ...dasar });
  });
}
const p = (teks, o = {}) => new Paragraph({ children: runs(teks), alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: 360 }, indent: o.tanpaIndent ? undefined : { firstLine: 567 }, ...o.para });
const tengah = (teks, o = {}) => new Paragraph({ children: runs(teks, o.run), alignment: AlignmentType.CENTER,
  spacing: { after: o.after ?? 120, before: o.before ?? 0, line: o.line ?? 300 } });
const rumus = (teks) => new Paragraph({ children: runs(teks, { italics: true }), alignment: AlignmentType.CENTER, spacing: { before: 60, after: 120 } });
const poin = (teks, level = 0) => new Paragraph({ children: runs(teks), numbering: { reference: "poin", level },
  alignment: AlignmentType.JUSTIFIED, spacing: { after: 60, line: 340 } });
const nomor = (teks, ref) => new Paragraph({ children: runs(teks), numbering: { reference: ref, level: 0 },
  alignment: AlignmentType.JUSTIFIED, spacing: { after: 60, line: 340 } });

let bab = 0, nGambar = 0, nTabel = 0, nNomor = 0;
const daftarNomor = [];
function urut() { nNomor += 1; const ref = `urut${nNomor}`; daftarNomor.push(ref); return (t) => nomor(t, ref); }

function h1(judul) {
  bab += 1; nGambar = 0; nTabel = 0;
  const romawi = ["", "I", "II", "III", "IV", "V", "VI"][bab];
  return [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 360 },
      children: [new TextRun({ text: `BAB ${romawi}`, font: FONT, bold: true, size: 28 }), new TextRun({ text: judul.toUpperCase(), font: FONT, bold: true, size: 28, break: 1 })] }),
  ];
}
const h1Biasa = (judul) => [new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [new TextRun({ text: judul.toUpperCase(), font: FONT, bold: true, size: 28 })] })];
const h2 = (judul) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 },
  children: [new TextRun({ text: judul, font: FONT, bold: true, size: 24 })] });
const h3 = (judul) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 100 },
  children: [new TextRun({ text: judul, font: FONT, bold: true, italics: true, size: 24 })] });

function gambar(file, keterangan, lebarCm = 15) {
  const buf = fs.readFileSync(path.join(GAMBAR, file));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20); // header PNG
  const lebar = lebarCm * 37.8, tinggi = (lebar * h) / w;
  nGambar += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: "png", data: buf, transformation: { width: lebar, height: tinggi } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: runs(`**Gambar ${bab}.${nGambar}** ${keterangan}`, { size: 20 }) }),
  ];
}

const garis = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
function tabel(keterangan, kepala, baris, lebar) {
  nTabel += 1;
  const total = lebar.reduce((a, b) => a + b, 0);
  const sel = (t, i, head) => new TableCell({
    width: { size: lebar[i], type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, color: "auto", fill: "D9E2F3" } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    borders: { top: garis, bottom: garis, left: garis, right: garis },
    children: [new Paragraph({ alignment: head ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { after: 0, line: 260 },
      children: runs(String(t), { size: 20, bold: head || undefined }) })],
  });
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80 }, keepNext: true,
      children: runs(`**Tabel ${bab}.${nTabel}** ${keterangan}`, { size: 20 }) }),
    new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: lebar, alignment: AlignmentType.CENTER,
      rows: [new TableRow({ tableHeader: true, children: kepala.map((t, i) => sel(t, i, true)) }),
        ...baris.map((r) => new TableRow({ children: r.map((t, i) => sel(t, i, false)) }))] }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ];
}
const L = 9071; // lebar area teks (A4 − margin 4 cm + 3 cm) dalam DXA

// ---------------------------------------------------------------- isi
const nb = M.naive_bayes, knn = M.knn, dt = M.decision_tree;
const kl = K.klaster;
const klLaporan = kl.filter((c) => c.pct_laporan >= 20);
const s = B.studi, r = B.rata_titik_banjir, bm = B.benchmark;
const rg = K.rouge, wx = K.wilcoxon;
const wxCari = (pb, m) => wx.find((w) => w.pembanding.startsWith(pb) && w.metrik === m);

const cover = [
  tengah("**LAPORAN PROYEK UJIAN TENGAH SEMESTER**", { run: { size: 28 }, after: 120 }),
  tengah("Mata Kuliah: Kecerdasan Artifisial", { run: { size: 24 }, after: 480 }),
  tengah("**AGEN CERDAS PERINGKAS LAPORAN BANJIR:**", { run: { size: 28 }, after: 60 }),
  tengah("**Klasterisasi dan Peringkasan Hybrid TF-IDF Tweet Banjir Jabodetabek dengan Rute Evakuasi A{*} (Studi Kasus Ciledug)**", { run: { size: 26 }, after: 480 }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 }, children: [new ImageRun({ type: "png",
    data: fs.readFileSync("laporan/assets/Emblem_of_Budi_Luhur_University.png"), transformation: { width: 180, height: 184 } })] }),
  tengah("Tema: Mesin Peringkasan & Klasterisasi (Tema D)", { after: 360 }),
  tengah("Disusun oleh:", { after: 120 }),
  tengah("**Izvio Prijaya Mumin** (2611600087)", { after: 60 }),
  tengah("**Fatah Idzhar Hamdi** (2611600129)", { after: 480 }),
  tengah("Dosen Pengampu: Dr. Indra, S.Kom, M.T.I", { after: 960 }),
  tengah("**PROGRAM STUDI MAGISTER ILMU KOMPUTER**", { after: 40 }),
  tengah("**FAKULTAS TEKNOLOGI INFORMASI**", { after: 40 }),
  tengah("**UNIVERSITAS BUDI LUHUR**", { after: 40 }),
  tengah("**JAKARTA 2026**", { after: 0 }),
];

const depan = [
  ...h1Biasa("Abstrak").slice(1),
  p(`Saat banjir, media sosial dipenuhi ribuan unggahan yang bercampur antara laporan kejadian, opini, candaan, dan iklan, sehingga petugas sulit menyaring informasi yang berguna. Proyek ini membangun **agen cerdas** yang menyaring, mengelompokkan, meringkas, dan menindaklanjuti tweet banjir. Klasifikasi laporan memakai tiga algoritma *supervised learning* pada ${A.nb1.total} tweet banjir berlabel (Ariyanto dkk., 2025); **Naive Bayes** terpilih melalui *cross-validation* dengan F1 uji ${id(nb.f1)}. Inti proyek adalah **klasterisasi** ${ribu(K.korpus)} tweet banjir Jabodetabek dengan TF-IDF + LSA dan K-Means (k = ${K.k}, metode *elbow*), lalu **peringkasan Hybrid TF-IDF** per klaster. Evaluasi ROUGE terhadap ringkasan acuan dua anotator menunjukkan Hybrid TF-IDF (ROUGE-1 ${id(rg["Hybrid TF-IDF"].R1)}) cenderung lebih baik dari TF-IDF standar (${id(rg["TF-IDF standar"].R1)}) tetapi setara dengan pemilihan acak, dan tidak ada selisih yang signifikan secara statistik pada 10 set evaluasi. Untuk tindak lanjut, agen mencari rute evakuasi di jaringan jalan Ciledug (${ribu(B.node)} persimpangan) yang menghindari genangan; **A{*}** selalu optimal dan memeriksa node ${id(B.rasio_astar_ucs, 1)}× lebih sedikit daripada *Uniform Cost Search*.`),
  p("**Kata kunci:** agen cerdas, klasterisasi, Hybrid TF-IDF, peringkasan tweet, Naive Bayes, A{*}, banjir, Ciledug.", { tanpaIndent: true }),
  ...h1Biasa("Pernyataan Integritas Akademik"),
  p("Seluruh dataset, kutipan, dan pustaka pihak ketiga yang digunakan dicantumkan sumbernya di Daftar Pustaka dan di notebook. Ringkasan acuan untuk evaluasi ditulis sendiri oleh kedua anggota secara terpisah tanpa alat bantu AI. Dalam penulisan kode dan penyusunan draf laporan, kelompok menggunakan asisten AI sebagai alat bantu; seluruh hasil telah ditinjau, dijalankan ulang, dan dipahami oleh kedua anggota kelompok."),
  ...h1Biasa("Daftar Isi"),
  new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-3" }),
];

const babI = [
  ...h1("Pengantar dan Agen Cerdas"),
  h2("1.1 Latar Belakang"),
  p("Banjir adalah bencana yang paling sering melanda wilayah Jabodetabek. Kawasan Ciledug, Larangan, dan Karang Tengah di Kota Tangerang termasuk wilayah rawan karena topografinya rendah dan dilalui Kali Angke; BPBD Kota Tangerang mencatat genangan 20–50 cm di kawasan ini pada Februari 2026. Saat banjir terjadi, warga melaporkan kondisi lewat media sosial, sehingga media sosial menjadi sumber informasi situasional yang cepat (Bhoi dkk., 2025; Wibowo dkk., 2025)."),
  p(`Masalahnya, sebagian besar tweet yang memuat kata "banjir" bukan laporan kejadian. Pada data berlabel yang dipakai proyek ini, hanya ${A.nb1.laporan} dari ${A.nb1.total} tweet (${id((100 * A.nb1.laporan) / A.nb1.total, 1)}%) merupakan laporan kejadian nyata; sisanya opini, politik, doa, atau kiasan. Penelitian terdahulu menunjukkan bahwa klasifikasi relevansi dan pemetaan tweet banjir dapat membantu manajemen bencana (Blomeier dkk., 2024; Taufiq & Girsang, 2024; Mauluvy Senjaya & Sibaroni, 2025), dan peringkasan tweet bencana dapat memadatkan ribuan unggahan menjadi laporan singkat (Garg dkk., 2024).`),
  p("Proyek ini menggabungkan ketiga kebutuhan tersebut dalam satu **agen cerdas**: menyaring laporan, mengelompokkan tweet per topik kejadian (klasterisasi), meringkas setiap kelompok (mesin peringkasan), dan mencari rute evakuasi yang menghindari genangan di Ciledug."),
  h2("1.2 Rumusan Masalah dan Tujuan"),
  (() => { const n = urut(); return [
    n("Bagaimana mengenali tweet yang merupakan laporan kejadian banjir dan algoritma *supervised learning* mana yang paling optimal (Naive Bayes, KNN, Decision Tree)?"),
    n("Bagaimana mengelompokkan ribuan tweet banjir menjadi topik-topik kejadian tanpa label (klasterisasi)?"),
    n("Seberapa baik metode Hybrid TF-IDF meringkas setiap kelompok dibandingkan ringkasan buatan manusia dan baseline?"),
    n("Bagaimana agen mencari rute evakuasi yang menghindari ruas tergenang, dan algoritma *searching* mana yang paling efisien?"),
  ]; })(),
  h2("1.3 Peran Kecerdasan Artifisial dan Machine Learning"),
  p("Kecerdasan Artifisial (AI) adalah studi tentang agen yang menerima persepsi dari lingkungannya dan melakukan tindakan untuk mencapai tujuan (Russell & Norvig, 2021). Dalam domain tanggap banjir, AI berperan pada tiga kemampuan agen:"),
  poin("**Memahami bahasa** (*Natural Language Processing*): mengubah tweet berbahasa Indonesia yang tidak baku menjadi fitur yang bisa diolah."),
  poin("**Belajar dari data** (*Machine Learning*): *supervised learning* (Naive Bayes, KNN, Decision Tree) mempelajari pola laporan dari tweet berlabel; *unsupervised learning* (K-Means) menemukan kelompok topik tanpa label."),
  poin("**Merencanakan tindakan** (*problem solving by searching*): BFS, DFS, UCS, dan A{*} mencari urutan ruas jalan dari lokasi laporan ke tempat aman."),
  h2("1.4 Arsitektur Agen: Spesifikasi PEAS"),
  p("Agen dirancang sebagai *learning-based goal-based agent*: tujuannya menghasilkan laporan situasi yang ringkas dan rute evakuasi berbiaya minimum. Spesifikasi PEAS (Russell & Norvig, 2021; Bansal dkk., 2024) dirangkum pada Tabel 1.1."),
  ...tabel("Spesifikasi PEAS agen", ["Komponen", "Spesifikasi"], [
    ["Performance measure", `F1 klasifikasi laporan; kualitas ringkasan (ROUGE terhadap acuan manusia); biaya dan jarak rute; jumlah node yang diperiksa (efisiensi)`],
    ["Environment", "Aliran tweet banjir Jabodetabek; jaringan jalan Ciledug dan sekitarnya (OpenStreetMap); titik genangan BPBD; tempat aman (RS, klinik, damkar, polisi, kantor pemerintahan)"],
    ["Actuators", "Label laporan/bukan, kelompok topik, ringkasan 3 tweet per klaster, rute evakuasi di peta (dashboard web)"],
    ["Sensors", "Teks dan waktu tweet; data peta jalan dan koordinat titik banjir"],
  ], [2300, L - 2300]),
  h2("1.5 Sifat Lingkungan"),
  ...tabel("Sifat lingkungan agen", ["Sifat", "Kategori", "Alasan"], [
    ["Observability", "Partially observable", "Agen hanya melihat apa yang ditulis pengguna; banyak kejadian tidak dilaporkan dan lokasi sering tidak lengkap"],
    ["Determinism", "Stochastic", "Isi dan waktu tweet tidak bisa diprediksi; genangan berubah sesuai hujan"],
    ["Episodic/Sequential", "Episodik (klasifikasi), sekuensial (rute)", "Setiap tweet dinilai mandiri; langkah rute bergantung pada langkah sebelumnya"],
    ["Static/Dynamic", "Dynamic", "Tweet terus masuk dan kondisi genangan berubah selama agen bekerja"],
    ["Discrete/Continuous", "Discrete", "Kata, label, dan persimpangan jalan adalah himpunan diskret"],
    ["Single/Multi-agent", "Single-agent", "Tidak ada agen lain yang bersaing dalam model ini"],
  ], [2000, 2400, L - 4400]),
  h2("1.6 Kontribusi pada Industri 4.0/5.0 dan Sistem Enterprise"),
  p("Dalam kerangka Society 5.0, data dari ruang siber (media sosial) diolah AI untuk menyelesaikan masalah di ruang fisik (keselamatan warga). Agen ini berkontribusi melalui:"),
  poin("**Otomatisasi pemantauan**: petugas tidak perlu membaca ribuan tweet; agen menyajikan beberapa laporan situasi per topik."),
  poin("**Integrasi sistem enterprise**: hasil disimpan di basis data PostgreSQL (Supabase) dan dapat dikonsumsi sistem lain, misalnya modul *ticketing* CRM pusat panggilan darurat atau modul *fleet management* ERP untuk merutekan kendaraan menghindari genangan (Verdugo Fernández dkk., 2026; Esparza dkk., 2024)."),
  poin("**Biaya rendah**: model dijalankan di browser dan data terbuka (OpenStreetMap), sehingga dapat diterapkan pemerintah daerah atau perusahaan logistik tanpa server khusus."),
  h2("1.7 Batasan"),
  poin("Data tweet berasal dari dataset publik 2018–2023 (bukan *crawling* langsung), dan korpus hasil sampling sehingga tidak semua kejadian terwakili."),
  poin("Rute dihitung pada radius 4,5 km dari Kantor Kecamatan Ciledug; genangan dimodelkan sebagai lingkaran 150–300 m di sekitar titik BPBD."),
];

const babII = [
  ...h1("Problem Solving dan Formulasi Strategi"),
  h2("2.1 Formulasi Masalah sebagai State Space"),
  p("Setelah tweet dikenali sebagai laporan dan lokasinya diketahui, agen harus mencari rute dari lokasi laporan ke tempat aman terdekat. Masalah ini diformulasikan sebagai pencarian pada ruang keadaan (Tabel 2.1)."),
  ...tabel("Formulasi state space pencarian rute evakuasi", ["Komponen", "Definisi"], [
    ["State", "Persimpangan jalan (node graf OpenStreetMap) tempat kendaraan berada"],
    ["Initial state", "Node terdekat dari lokasi laporan banjir"],
    ["Actions / operators", "Bergerak ke persimpangan tetangga melalui ruas jalan yang dapat dilalui mobil (mengikuti arah jalan satu arah)"],
    ["Transition model", "Result(s, a) = persimpangan di ujung ruas yang dipilih"],
    ["Goal test", `State adalah salah satu dari ${B.aman} node tempat aman di luar radius genangan`],
    ["Path cost", "Σ biaya ruas; biaya = panjang ruas (m) × 20 bila ruas tergenang (skenario banjir), × 1 bila tidak"],
  ], [2300, L - 2300]),
  p("Penalti ×20 dipilih (bukan menutup jalan) karena genangan 20–50 cm masih dapat dilalui kendaraan darurat dengan sangat lambat; agen menghindarinya kecuali tidak ada alternatif, misalnya bila titik awal berada di dalam genangan."),
  h2("2.2 Strategi Pencarian"),
  p("Empat strategi dibandingkan (Russell & Norvig, 2021):"),
  poin("**Breadth-First Search (BFS)**: *uninformed*, memperluas node per lapisan; optimal terhadap **jumlah langkah**, bukan panjang jalan."),
  poin("**Depth-First Search (DFS)**: *uninformed*, menyusuri satu cabang sedalam mungkin; hemat memori tetapi tidak optimal."),
  poin("**Uniform Cost Search (UCS)**: *uninformed*, memperluas node dengan biaya terkecil; optimal terhadap biaya; dipakai sebagai pembanding optimalitas."),
  poin("**A{*} Search**: *informed*, memperluas node dengan f(n) = g(n) + h(n). Heuristik h(n) adalah jarak garis lurus (haversine) ke tempat aman terdekat."),
  rumus("h(n) = min₍g ∈ Goal₎ haversine(n, g)"),
  p("Heuristik ini **admissible** karena biaya ruas mana pun ≥ panjangnya ≥ jarak garis lurus, sehingga A{*} dijamin menemukan rute berbiaya minimum (Hanafi dkk., 2025; Pratama, 2024). Kebenaran implementasi diverifikasi: biaya A{*} dan UCS sama dengan algoritma Dijkstra pustaka networkx pada 20 pasangan acak."),
  p("Konsep pencarian juga muncul pada **Decision Tree** (BAB III): pembentukan pohon adalah pencarian *greedy* dengan state = node berisi subset data, action = memilih fitur pemecah, heuristik = *information gain* terbesar, dan goal test = node murni atau batas kedalaman."),
  h2("2.3 Lingkungan Pencarian"),
  p(`Jaringan jalan mobil dalam radius 4,5 km dari Kantor Kecamatan Ciledug diambil dari OpenStreetMap dengan pustaka OSMnx (Boeing, 2017), menghasilkan ${ribu(B.node)} persimpangan dan ${ribu(B.ruas)} ruas berarah. Tujuh titik genangan diambil dari daftar BPBD Kota Tangerang yang diberitakan media (Tabel 2.2), menandai ${ribu(B.ruas_genang)} ruas sebagai tergenang.`),
  ...tabel("Titik genangan yang dipetakan", ["No", "Lokasi", "Radius"], B.banjir.map((f, i) => [i + 1, f.name, `${f.radius} m`]), [700, L - 2000, 1300]),
  ...gambar("03_peta_lingkungan.png", "Lingkungan agen: jaringan jalan Ciledug, ruas tergenang (biru), dan tempat aman (hijau)", 13),
  h2("2.4 Diagram Alir dan Arsitektur Sistem"),
  p("Gambar 2.2 menunjukkan alur kerja agen dari tweet masuk sampai rute ditampilkan, dan Gambar 2.3 menunjukkan arsitektur sistem."),
  ...gambar("00_flowchart.png", "Diagram alir agen cerdas peringkas laporan banjir", 12),
  ...gambar("00_arsitektur.png", "Arsitektur sistem", 16),
  h2("2.5 Hasil Pencarian"),
  h3("Studi kasus: Jalan Raden Saleh Raya, Karang Mulya"),
  p(`Titik ini dipilih otomatis karena rutenya paling berubah ketika informasi genangan dipakai. Tanpa informasi genangan, tempat aman terdekat hanya ${ribu(s["normal|A*"].jarak)} m, tetapi jalurnya melewati ruas tergenang. Dengan penalti genangan, A{*} memilih tempat aman lain sejauh ${id(s["banjir|A*"].jarak / 1000, 2)} km yang bebas genangan dengan memeriksa ${s["banjir|A*"].expanded} node. BFS tetap memilih jalur tergenang karena hanya menghitung langkah, sedangkan DFS menempuh ${id(s["banjir|DFS"].jarak / 1000, 2)} km.`),
  ...gambar("03_eksplorasi_banjir.png", "Node yang diperiksa (oranye) dan rute (merah) oleh BFS, DFS, dan A{*} pada skenario banjir", 16),
  ...gambar("03_astar_normal_vs_banjir.png", "Rute A{*} tanpa dan dengan informasi genangan", 10),
  h3("Perbandingan pada 7 titik banjir dan 50 pasangan acak"),
  ...tabel("Rata-rata hasil pencarian dari 7 titik banjir", ["Algoritma", "Normal: jarak (m)", "Normal: node", "Banjir: jarak (m)", "Banjir: node"],
    ["BFS", "DFS", "UCS", "A*"].map((a) => [a === "A*" ? "A{*}" : a, ribu(r[`normal|${a}`].jarak), id(r[`normal|${a}`].expanded, 1), ribu(r[`banjir|${a}`].jarak), id(r[`banjir|${a}`].expanded, 1)]),
    [1600, 1870, 1870, 1870, 1861]),
  ...tabel("Benchmark 50 pasangan titik acak (skenario banjir)", ["Algoritma", "Node diperiksa (rata-rata)", "Biaya / optimal", "Rute optimal"],
    ["BFS", "DFS", "UCS", "A*"].map((a) => [a === "A*" ? "A{*}" : a, ribu(bm[a].expanded), `${id(bm[a].rasio, 2)}×`, `${bm[a].optimal}%`]),
    [1800, 2800, 2200, L - 6800]),
  p(`A{*} selalu optimal dan rata-rata memeriksa node ${id(B.rasio_astar_ucs, 1)}× lebih sedikit dari UCS. BFS hanya optimal pada ${bm.BFS.optimal}% pasangan dan DFS tidak pernah optimal (biaya rata-rata ${id(bm.DFS.rasio, 1)}× optimal). Menghindari genangan menambah jarak A{*} rata-rata ${B.tambah_jarak} m dari 7 titik laporan.`),
];

const babIII = [
  ...h1("Metode Machine Learning dan Implementasi"),
  h2("3.1 Dataset"),
  p(`Dataset utama adalah *Semantic Role Labeling Datasets for Crisis Event* (Ariyanto dkk., 2025; lisensi CC BY 4.0), berisi tweet berbahasa Indonesia 2018–2023 yang dianotasi dua anotator (Fleiss' Kappa > 0,80). Label tersedia **per token**; label **per tweet** diturunkan: tweet berlabel *laporan* bila memiliki token *FLOOD-EVENT* (laporan kejadian nyata) dan *bukan_laporan* bila hanya *FALSE-EVENT*. Dari ${A.nb1.awal} tweet banjir, ${A.nb1.melayu} tweet berbahasa Melayu dibuang, sehingga tersisa ${A.nb1.total} tweet (${A.nb1.laporan} laporan, ${A.nb1.total - A.nb1.laporan} bukan laporan). Data dibagi *stratified* 80:20 (${A.nb1.latih} latih, ${A.nb1.uji} uji).`),
  ...gambar("01_distribusi_kelas.png", "Distribusi kelas dan panjang tweet", 14),
  h2("3.2 Pra-pemrosesan Data"),
  (() => { const n = urut(); return [
    n("**Case folding**: semua huruf menjadi kecil."),
    n("**Cleaning**: menghapus URL, *mention*, simbol #, dan tanda baca. Angka diganti token *angka* karena laporan sering memuat angka (\"air 50 cm\", \"RT 03\")."),
    n("**Normalisasi slang**: kata tidak baku diubah ke bentuk baku (mis. *gak* → *tidak*)."),
    n("**Stopword removal**: daftar Sastrawi, dengan mempertahankan kata yang penting untuk makna banjir (*tidak, belum, masih, sudah, tinggi*)."),
    n("**Stemming**: algoritma Nazief–Adriani (pustaka Sastrawi), lalu stopword dibuang lagi (Saraswati dkk., 2025)."),
  ]; })(),
  ...gambar("01_kata_teratas.png", "Kata paling sering pada tiap kelas setelah pra-pemrosesan", 15),
  h2("3.3 Metode Supervised Learning"),
  p(`Fitur adalah **TF-IDF** unigram + bigram (min_df = 2, *sublinear tf*), menghasilkan ${ribu(A.nb2_vocab)} fitur. Tiga algoritma dibandingkan (Harun & Fahmi, 2024; Miranda & Suryono, 2025; Gorat dkk., 2026):`),
  poin("**Multinomial Naive Bayes**: menerapkan teorema Bayes dengan asumsi independensi antarkata."),
  rumus("P(c | d) ∝ P(c) · Π P(wᵢ | c)"),
  poin("**K-Nearest Neighbors (KNN)**: kelas mayoritas dari k tetangga terdekat dengan jarak *cosine*."),
  poin("**Decision Tree**: memecah data berdasarkan fitur dengan *information gain* terbesar (entropi/Gini)."),
  p("Hyperparameter dicari dengan **GridSearchCV** 5-fold *stratified* dengan metrik F1 (kelas tidak seimbang). Model terbaik dipilih dari **F1 cross-validation**, bukan dari data uji, agar evaluasi uji tetap jujur."),
  h2("3.4 Hasil dan Evaluasi"),
  ...tabel("Kinerja model pada data uji", ["Model", "Akurasi", "Presisi", "Recall", "F1 uji", "F1 CV (±std)", "Parameter terbaik"],
    [["Naive Bayes", nb], ["KNN", knn], ["Decision Tree", dt]].map(([n, m]) => [n, id(m.accuracy), id(m.precision_score), id(m.recall), id(m.f1), `${id(m.cv_f1_mean)} ± ${id(m.cv_f1_std)}`,
      Object.entries(m.best_params).map(([k, v]) => `${k}=${v}`).join(", ")]),
    [1450, 1000, 1000, 1000, 1000, 1500, L - 6950]),
  ...gambar("02_confusion_matrix.png", "Confusion matrix ketiga model pada data uji", 16),
  ...gambar("02_perbandingan_metrik.png", "Perbandingan akurasi, presisi, recall, dan F1", 13),
  h2("3.5 Analisis dan Kesimpulan Algoritma"),
  p(`**Naive Bayes paling optimal**: F1 cross-validation tertinggi (${id(nb.cv_f1_mean)}) dan sekaligus F1 uji tertinggi (${id(nb.f1)}), dengan presisi dan recall seimbang (${id(nb.precision_score)} dan ${id(nb.recall)}). Pengaturan *prior* kelas seragam (fit_prior=False) menaikkan recall kelas laporan yang minoritas. KNN (F1 ${id(knn.f1)}) kesulitan pada vektor teks yang jarang, dan Decision Tree (F1 ${id(dt.f1)}) cenderung *overfit* pada kata spesifik. Hasil ini sejalan dengan penelitian klasifikasi tweet bencana yang menempatkan Naive Bayes sebagai baseline yang kuat untuk teks pendek (Airlangga, 2024; Gorat dkk., 2026).`),
  p("Kinerja F1 sekitar 0,6 tergolong moderat. Penyebabnya: data latih kecil (294 laporan), banyak tweet kiasan, dan label yang diturunkan dari anotasi per token. Model Naive Bayes ini dipakai agen sebagai penyaring laporan pada BAB IV."),
  ...gambar("02_decision_tree.png", "Tiga level teratas Decision Tree: pembentukan pohon sebagai pencarian greedy", 16),
];

const babIV = [
  ...h1("Metode NLP dan Text Mining: Klasterisasi dan Mesin Peringkasan"),
  p("Sesuai tema kelompok (*mesin peringkasan & klasterisasi*), bab ini adalah inti proyek. Tahapannya mengikuti alur klasifikasi/klasterisasi data Twitter pada ketentuan soal: pengumpulan data, *preliminary*, pra-pemrosesan, pelabelan, klasterisasi, peringkasan, dan pengujian."),
  h2("4.1 Pengumpulan Data dan Preliminary"),
  p(`Korpus diambil dari ${ribu(K.mentah)} tweet banjir mentah 2018–2023 pada dataset yang sama (Ariyanto dkk., 2025). Tweet yang menyebut wilayah Jabodetabek dipilih (${ribu(K.jabodetabek)} tweet), tweet berbahasa Melayu dan Inggris dibuang (${ribu(K.bersih)}), lalu duplikat dan tweet dengan kurang dari 3 kata bermakna dihapus, menghasilkan **${ribu(K.korpus)} tweet**.`),
  h2("4.2 Pra-pemrosesan dan Pelabelan"),
  p(`Pra-pemrosesan sama dengan BAB III (satu modul kode untuk seluruh proyek). Pelabelan dilakukan otomatis dengan model Naive Bayes dari BAB III: ${ribu(K.laporan_nb)} tweet (${id((100 * K.laporan_nb) / K.korpus, 1)}%) diprediksi sebagai laporan. Label ini tidak dipakai untuk membuang data, tetapi untuk mengukur proporsi laporan di setiap klaster.`),
  h2("4.3 Representasi: TF-IDF dan LSA"),
  p(`Setiap tweet direpresentasikan dengan TF-IDF unigram (min_df = 3, max_df = 0,5) sebanyak ${ribu(K.kosakata)} kata, lalu direduksi dengan **Latent Semantic Analysis** (TruncatedSVD) menjadi 100 dimensi topik laten yang dinormalisasi L2 (menjelaskan ${id(K.lsa_var, 1)}% variansi). Pada vektor ternormalisasi, jarak Euclidean setara jarak cosine sehingga cocok untuk K-Means.`),
  h2("4.4 Klasterisasi"),
  p(`K-Means dan Agglomerative Clustering (ward) dibandingkan untuk k = 3–20 menggunakan Silhouette, Davies-Bouldin, dan Calinski-Harabasz. K-Means unggul silhouette pada ${K.kmeans_unggul}% nilai k sehingga dipilih. Silhouette pada teks pendek terus naik seiring bertambahnya k, sehingga k dipilih dengan **metode elbow** (algoritma *kneedle*) pada kurva inertia: **k = ${K.k}**.`),
  p("Pada data ini terdapat banyak solusi K-Means dengan inertia yang hampir sama. Dengan inisialisasi acak (k-means++), dua solusi K-Means pada data yang identik hanya sepakat dengan ARI (*Adjusted Rand Index*) sekitar 0,4–0,6, dan uji ulang di Google Colab menghasilkan ARI 0,58 terhadap laptop karena selisih pembulatan CPU sekitar 1e-9. Karena itu centroid awal K-Means diambil dari rata-rata klaster **Agglomerative Ward** yang deterministik, lalu disempurnakan dengan iterasi Lloyd. Dengan cara ini, uji gangguan numerik 1e-12 sampai 1e-6 menghasilkan ARI = 1,0, sehingga hasil klasterisasi tidak lagi bergantung pada mesin yang menjalankannya."),
  ...gambar("04_pemilihan_k.png", "Silhouette, Davies-Bouldin, dan inertia untuk k = 3–20", 16),
  ...tabel(`Kualitas klaster pada k = ${K.k}`, ["Algoritma", "Silhouette (↑)", "Davies-Bouldin (↓)", "Calinski-Harabasz (↑)"],
    ["K-Means", "Agglomerative"].map((a) => [a, id(K[a].silhouette, 4), id(K[a].davies_bouldin, 3), id(K[a].calinski_harabasz, 1)]), [2300, 2257, 2257, 2257]),
  p("Nilai silhouette yang kecil (< 0,1) menunjukkan batas antartopik tweet tidak tegas. Hal ini wajar untuk teks pendek yang topiknya bercampur dan dibahas sebagai keterbatasan."),
  ...tabel("Profil klaster (urut dari proporsi laporan tertinggi)", ["Klaster", "Jumlah tweet", "% laporan", "Kata kunci"],
    kl.map((c) => [c.id, ribu(c.jumlah), `${id(c.pct_laporan, 1)}%`, c.kata_kunci.split(", ").slice(0, 6).join(", ")]), [1100, 1500, 1300, L - 3900]),
  ...gambar("04_klaster.png", "Sebaran tweet per klaster (proyeksi 2D) dan proporsi laporan", 16),
  p(`Klaster dengan proporsi laporan tinggi (${klLaporan.map((c) => `klaster ${c.id}`).join(", ")}) berisi laporan kejadian di wilayah Tangerang, Bekasi, dan Jakarta, seperti kawasan yang tergenang serta RT dan rumah yang terendam; klaster dengan proporsi laporan hampir nol berisi opini dan perdebatan politik tentang penanganan banjir (gubernur, presiden, janji penanganan). Dengan demikian Naive Bayes membantu agen membedakan klaster laporan dari klaster opini.`),
  h2("4.5 Mesin Peringkasan Hybrid TF-IDF"),
  p("Hybrid TF-IDF (Sharifi dkk., 2010) dirancang untuk teks pendek seperti tweet. TF dihitung atas seluruh kumpulan tweet sebagai satu dokumen, sedangkan IDF dihitung dengan setiap tweet sebagai satu dokumen:"),
  rumus("TF(w) = frekuensi w di semua tweet / total kata;  IDF(w) = log₂(N / jumlah tweet yang memuat w)"),
  rumus("S(t) = Σ₍w∈t₎ TF(w) · IDF(w) / max(11, |t|)"),
  p("Faktor normalisasi max(11, |t|) mencegah tweet panjang selalu menang. Tweet dipilih dari skor tertinggi, dengan melewati tweet yang terlalu mirip (cosine > 0,77) dengan tweet yang sudah terpilih agar ringkasan tidak berulang. Untuk laporan situasi, agen hanya meringkas tweet yang diprediksi laporan bila klaster memiliki minimal 10 tweet laporan. Contoh ringkasan klaster dengan proporsi laporan tertinggi:"),
  ...kl.slice(0, 2).flatMap((c) => [
    p(`**Klaster ${c.id}** (${ribu(c.jumlah)} tweet, ${id(c.pct_laporan, 1)}% laporan; kata kunci: ${c.kata_kunci.split(", ").slice(0, 5).join(", ")}):`, { tanpaIndent: true }),
    ...c.ringkasan.map((t) => poin(`[${t.waktu}] ${t.text.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim()}`)),
  ]),
  h2("4.6 Pengujian: Evaluasi ROUGE"),
  p("Ringkasan dievaluasi dengan ROUGE-1, ROUGE-2 (tumpang-tindih unigram/bigram), dan ROUGE-L (*longest common subsequence*). Dari klaster-klaster diambil 10 set masing-masing 25 tweet. Kedua anggota kelompok menulis **ringkasan acuan** 2–3 kalimat untuk setiap set secara terpisah tanpa alat bantu AI. Hybrid TF-IDF dibandingkan dengan dua baseline: TF-IDF standar (jumlah bobot TF-IDF per tweet) dan pemilihan 3 tweet acak (rata-rata 20 kali)."),
  ...tabel("Skor ROUGE F1 rata-rata (10 set × 2 acuan)", ["Metode", "ROUGE-1", "ROUGE-2", "ROUGE-L"], [
    ...["Hybrid TF-IDF", "TF-IDF standar", "Acak (rata-rata 20×)"].map((n) => [n, id(rg[n].R1), id(rg[n].R2), id(rg[n].RL)]),
    ["Kesepakatan antar-anotator (Izvio vs Fatah)", id(K.sepakat.R1), id(K.sepakat.R2), id(K.sepakat.RL)],
  ], [3800, 1757, 1757, 1757]),
  ...gambar("04_rouge.png", "Skor ROUGE ringkasan sistem terhadap acuan manusia", 12),
  p("Untuk menguji apakah selisih bermakna, skor setiap set dibandingkan berpasangan dengan uji **Wilcoxon signed-rank** (Tabel 4.4)."),
  ...tabel("Uji Wilcoxon berpasangan: Hybrid TF-IDF vs baseline", ["Pembanding", "Metrik", "Hybrid unggul", "Selisih rata-rata", "p-value"],
    wx.map((w) => [w.pembanding, w.metrik.replace("R", "ROUGE-"), w.unggul, id(w.selisih, 4), id(w.p, 3)]), [2600, 1300, 1700, 1800, L - 7400]),
  h2("4.7 Pembahasan"),
  p(`Hybrid TF-IDF **cenderung lebih baik** dari TF-IDF standar (ROUGE-1 ${id(rg["Hybrid TF-IDF"].R1)} vs ${id(rg["TF-IDF standar"].R1)}; unggul di ${wxCari("TF-IDF", "R1").unggul}), yang menunjukkan bahwa normalisasi panjang bekerja sesuai teori karena TF-IDF standar condong memilih tweet panjang. Namun Hybrid TF-IDF **setara dengan pemilihan acak** (p = ${id(wxCari("Acak", "R1").p, 2)}), dan tidak ada selisih yang signifikan pada α = 0,05.`),
  p(`Beberapa faktor menjelaskan hasil ini. Pertama, set evaluasi diambil dari satu klaster yang topiknya relatif seragam, sehingga tiga tweet acak pun sudah mewakili topik. Kedua, ringkasan acuan bersifat abstraktif (kalimat sendiri), sedangkan sistem bersifat ekstraktif (memilih tweet utuh). Ketiga, kesepakatan dua manusia hanya ROUGE-1 ${id(K.sepakat.R1)}, yang menunjukkan bahwa meringkas tweet bercampur memang subjektif dan menjadi batas atas realistis. Keempat, 10 set memberikan daya uji statistik yang kecil. Temuan ini sejalan dengan penelitian peringkasan tweet bencana yang menekankan sulitnya evaluasi tanpa ringkasan acuan berskala besar (Garg dkk., 2024; Gurning dkk., 2025).`),
  h2("4.8 Implementasi"),
  p("Seluruh tahapan diimplementasikan dalam Python (pandas, scikit-learn, Sastrawi, OSMnx) pada empat notebook Google Colab, dengan hasil disimpan di Supabase (PostgreSQL). Model Naive Bayes, graf jalan, dan hasil klasterisasi diekspor ke JSON untuk aplikasi web Next.js yang menjalankan klasifikasi, peringkasan, dan pencarian rute langsung di browser; kesamaan hasil web dan notebook dijamin oleh data uji (*fixtures*). Klasterisasi sensitif terhadap pembulatan angka, sehingga versi pustaka, jumlah *thread*, dan kernel BLAS dikunci (berkas requirements.txt), dan K-Means diinisialisasi dari centroid Agglomerative Ward, agar Colab dan lingkungan lokal menghasilkan klaster yang sama."),
  p(`Lingkungan acuan: ${K.lingkungan}.`, { tanpaIndent: true }),
];

const babV = [
  ...h1("Kesimpulan dan Saran"),
  h2("5.1 Kesimpulan"),
  (() => { const n = urut(); return [
    n(`Naive Bayes adalah algoritma *supervised learning* paling optimal untuk mengenali laporan banjir (F1 CV ${id(nb.cv_f1_mean)}, F1 uji ${id(nb.f1)}), mengungguli KNN (${id(knn.f1)}) dan Decision Tree (${id(dt.f1)}).`),
    n(`K-Means pada representasi TF-IDF + LSA mengelompokkan ${ribu(K.korpus)} tweet banjir Jabodetabek menjadi ${K.k} topik yang dapat ditafsirkan; proporsi laporan Naive Bayes membedakan klaster laporan kejadian dari klaster opini, meskipun batas antartopik tidak tegas (silhouette ${id(K["K-Means"].silhouette, 3)}).`),
    n(`Hybrid TF-IDF menghasilkan ringkasan yang cenderung lebih baik dari TF-IDF standar tetapi setara dengan pemilihan acak menurut ROUGE; tidak ada selisih yang signifikan pada 10 set evaluasi.`),
    n(`A{*} dengan heuristik haversine selalu menemukan rute optimal dan memeriksa node ${id(B.rasio_astar_ucs, 1)}× lebih sedikit dari UCS; informasi genangan mengubah rute evakuasi secara nyata (contoh Jl. Raden Saleh Raya: ${id(s["normal|A*"].jarak / 1000, 2)} km → ${id(s["banjir|A*"].jarak / 1000, 2)} km).`),
  ]; })(),
  h2("5.2 Saran"),
  poin("Memperbanyak set evaluasi dan anotator, serta memakai set lintas klaster agar perbedaan metode peringkasan dapat diuji dengan daya statistik yang cukup."),
  poin("Menguji representasi kontekstual (IndoBERT) untuk klasifikasi dan klasterisasi, serta peringkasan berbasis frasa kunci (Garg dkk., 2024)."),
  poin("Mengganti asumsi radius genangan dengan data genangan aktual (laporan warga terverifikasi atau sensor) dan mengekstraksi lokasi langsung dari teks tweet."),
];

const pustaka = [
  "Airlangga, G. (2024). Comparative analysis of machine learning models for real-time disaster tweet classification: Enhancing emergency response with social media analytics. *Brilliance: Research of Artificial Intelligence, 4*(1), 25–31. https://doi.org/10.47709/brilliance.v4i1.3669",
  "Ariyanto, A. D. P., Purwitasari, D., Amaliah, B., Fatichah, C., Taqiuddin, M. G., & Haikal. (2025). Annotated data for semantic role labeling of crisis events in Indonesian Tweets. *Data in Brief, 61*, 111688. https://doi.org/10.1016/j.dib.2025.111688",
  "Bansal, R., Gupta, S., Shankar, K. R., & Arundhati. (2024). Exploring artificial intelligence PEAS framework for enhanced decision-making. *Recent Research Reviews Journal, 3*(2), 397–409. https://doi.org/10.36548/rrrj.2024.2.007",
  "Bhoi, A., Bhuyan, H. B. G. S., Nayak, R. P., Balabantaray, R. C., Pattanaik, A., & Chinmay, A. (2025). Smart crisis response leveraging social media content for effective disaster management. *Discover Computing, 28*(1). https://doi.org/10.1007/s10791-025-09749-1",
  "Blomeier, E., Schmidt, S., & Resch, B. (2024). Drowning in the information flood: Machine-learning-based relevance classification of flood-related tweets for disaster management. *Information, 15*(3), 149. https://doi.org/10.3390/info15030149",
  "Boeing, G. (2017). OSMnx: New methods for acquiring, constructing, analyzing, and visualizing complex street networks. *Computers, Environment and Urban Systems, 65*, 126–139.",
  "Esparza, M., Farahmand, H., Liu, X., & Mostafavi, A. (2024). Enhancing inundation monitoring of road networks using crowdsourced flood reports. *Urban Informatics, 3*(1). https://doi.org/10.1007/s44212-024-00055-7",
  "Garg, P. K., Chakraborty, R., Gupta, S., & Dandapat, S. K. (2024). IKDSumm: Incorporating key-phrases into BERT for extractive disaster tweet summarization. *Computer Speech & Language, 87*, 101649. https://doi.org/10.1016/j.csl.2024.101649",
  "Gorat, P., Pakpahan, F. S., & Sipayung, S. P. (2026). Analisis sentimen opini warga X terhadap banjir di Sumatera menggunakan Naive Bayes. *Jurnal Dinamika Informatika, 15*(1), 17–28. https://doi.org/10.31316/jdi.v15i1.461",
  "Gurning, Y. C., Saragih, S. C., Lase, Y. Y., & Julham, J. (2025). Perbandingan TextRank berbasis TF-IDF dan Word2Vec dalam peringkasan teks berita bahasa Indonesia. *JUKTISI, 4*(2), 922–928. https://doi.org/10.62712/juktisi.v4i2.552",
  "Hanafi, S., Rianjaya, I. D., & Hasibuan, L. H. (2025). Mapping evacuation routes during a tsunami using the A{*} algorithm. *Journal of Applied Mathematics and Modelling, 1*(2), 131–140. https://doi.org/10.64570/jamm.v1i2.55",
  "Harun, R. M., & Fahmi, F. (2024). Analisis sentimen menggunakan algoritma Naïve Bayes, KNN, dan Decision Tree terhadap ulasan aplikasi KitaLulus. *Building of Informatics, Technology and Science (BITS), 6*(3), 2033–2042. https://doi.org/10.47065/bits.v6i3.6367",
  "Mauluvy Senjaya, A., & Sibaroni, Y. (2025). Geospatial sentiment analysis of Twitter user (X) on government performance in overcoming floods in Jabodetabek using IndoBERT and CNN-LSTM methods. *Jurnal Pendidikan dan Teknologi Indonesia, 5*(11), 3386–3398. https://doi.org/10.52436/1.jpti.1182",
  "Miranda, K., & Suryono, R. R. (2025). Analisis sentimen pinjaman online: Studi komparatif algoritma Naïve Bayes, Decision Tree, dan KNN. *Edumatic: Jurnal Pendidikan Informatika, 9*(2), 372–381. https://doi.org/10.29408/edumatic.v9i2.30142",
  "Pratama, J. Y. (2024). Analisis perbandingan algoritma Dijkstra dan A-Star dalam menentukan rute terpendek. *JIMU: Jurnal Ilmiah Multidisipliner, 2*(03), 668–682. https://doi.org/10.70294/jimu.v2i03.423",
  "Russell, S., & Norvig, P. (2021). *Artificial intelligence: A modern approach* (4th ed.). Pearson.",
  "Saraswati, N. W. S., Yanti, C. P., Muku, I. D. M. K., & Dewi, D. A. P. R. (2025). Evaluation analysis of the necessity of stemming and lemmatization in text classification. *MATRIK: Jurnal Manajemen, Teknik Informatika dan Rekayasa Komputer, 24*(2), 321–332. https://doi.org/10.30812/matrik.v24i2.4833",
  "Sharifi, B., Hutton, M.-A., & Kalita, J. (2010). Experiments in microblog summarization. *2010 IEEE Second International Conference on Social Computing*, 49–56.",
  "Taufiq, M. I., & Girsang, A. S. (2024). Utilization of geocoding for mapping infrastructure impacts and mobility due to floods in Indonesia based on Twitter analytics. *JPPI (Jurnal Penelitian Pendidikan Indonesia), 10*(3), 903–913. https://doi.org/10.29210/020244467",
  "Verdugo Fernández, E. M., As Samee, A. M., Arzoumanidis, L., Nguyen, H. D. A. S., & Dehbi, Y. (2026). Graph-based safe-routing for flood-aware evacuation in urban environments. *ISPRS Annals of the Photogrammetry, Remote Sensing and Spatial Information Sciences, XII-4/W2-2026*, 195–202. https://doi.org/10.5194/isprs-annals-xii-4-w2-2026-195-2026",
  "Wibowo, A., Amri, I., Surahmat, A., & Rusdah, R. (2025). Leveraging artificial intelligence in disaster management: A comprehensive bibliometric review. *Jàmbá: Journal of Disaster Risk Studies, 17*(1). https://doi.org/10.4102/jamba.v17i1.1776",
];
const belakang = [
  ...h1Biasa("Daftar Pustaka"),
  ...pustaka.map((t) => new Paragraph({ children: runs(t), alignment: AlignmentType.LEFT, indent: { left: 567, hanging: 567 }, spacing: { after: 120, line: 300 } })),
  ...h1Biasa("Lampiran: Kode Program dan Data"),
  ...(() => { bab = "L"; nTabel = 0; return []; })(),
  p("Seluruh kode, data, dan hasil tersedia di repositori GitHub berikut:", { tanpaIndent: true }),
  new Paragraph({ children: [new ExternalHyperlink({ link: "https://github.com/izviopm/uts-ai-banjir-ciledug",
    children: [new TextRun({ text: "https://github.com/izviopm/uts-ai-banjir-ciledug", style: "Hyperlink", font: FONT })] })], spacing: { after: 160 } }),
  ...tabel("Isi repositori", ["Berkas", "Isi"], [
    ["notebooks/01_eda_preprocessing.ipynb", "EDA, label tingkat tweet, penyaringan bahasa Melayu, pra-pemrosesan, pembagian data"],
    ["notebooks/02_klasifikasi.ipynb", "Naive Bayes, KNN, Decision Tree; GridSearchCV; evaluasi; ekspor model"],
    ["notebooks/03_searching_rute.ipynb", "Graf jalan Ciledug; BFS, DFS, UCS, A{*}; skenario genangan; benchmark"],
    ["notebooks/04_klasterisasi_peringkasan.ipynb", "Korpus Jabodetabek; TF-IDF + LSA; K-Means vs Agglomerative; Hybrid TF-IDF; ROUGE; uji Wilcoxon"],
    ["notebooks/teks.py, notebooks/ringkas.py", "Modul pra-pemrosesan dan Hybrid TF-IDF yang dipakai bersama"],
    ["data/reference/", "Set evaluasi dan lembar ringkasan acuan kedua anotator"],
    ["supabase/schema.sql", "Skema basis data uts_ai_bencana"],
    ["docs/web/, web/", "Dokumentasi dan aplikasi web demo"],
  ], [3600, L - 3600]),
];

// ---------------------------------------------------------------- dokumen
const nomorConfig = [{ reference: "poin", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
  style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ...daftarNomor.map((ref) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }))];
// isi bab dibangun dulu agar daftarNomor terisi sebelum konfigurasi dibuat
const isi = [...babI, ...babII, ...babIII, ...babIV, ...babV, ...belakang].flat();
nomorConfig.splice(1, nomorConfig.length - 1, ...daftarNomor.map((ref) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL,
  text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] })));

const halaman = { size: { width: 11906, height: 16838 }, margin: { top: 1701, bottom: 1701, left: 2268, right: 1701 } };
const kaki = () => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 22 })] })] });

const doc = new Document({
  creator: "Izvio Prijaya Mumin, Fatah Idzhar Hamdi",
  title: "Laporan UTS Kecerdasan Artifisial — Agen Cerdas Peringkas Laporan Banjir",
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 28, bold: true }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 24, bold: true }, paragraph: { outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 24, bold: true, italics: true }, paragraph: { outlineLevel: 2 } },
    ],
  },
  numbering: { config: nomorConfig },
  features: { updateFields: true },
  sections: [
    { properties: { page: halaman }, children: cover },
    { properties: { type: SectionType.NEXT_PAGE, page: { ...halaman, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
      footers: { default: kaki() }, children: depan.flat() },
    { properties: { type: SectionType.NEXT_PAGE, page: { ...halaman, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      footers: { default: kaki() }, children: isi.slice(1) /* buang PageBreak pertama: section baru sudah ganti halaman */ },
  ],
});

const keluar = "laporan/Laporan_UTS_Kecerdasan_Artifisial_Izvio_Fatah.docx";
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(keluar, b); console.log("ditulis:", keluar, Math.round(b.length / 1024), "KB"); });
