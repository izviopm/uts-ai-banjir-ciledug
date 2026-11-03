// Membuat slide presentasi UTS (.pptx) dari angka laporan dan gambar di laporan/gambar/.
// Jalankan dari root repo:  NODE_PATH=<folder node_modules berisi pptxgenjs> node scripts/buat_presentasi.js
const pptxgen = require("pptxgenjs");
const path = require("path");

const G = (f) => path.join("laporan", "gambar", f);
const OUT = "laporan/Presentasi_UTS_Kecerdasan_Artifisial_Izvio_Fatah.pptx";

// palet: biru tua (langit malam banjir), biru air, oranye peringatan
const NAVY = "14213D", BIRU = "1F6FB2", ORANYE = "C2560C", ORANYE_MUDA = "F2A65A";
const PUTIH = "FFFFFF", ABU_MUDA = "EEF2F6", ABU = "5A6678", GARIS = "D5DCE4", BIRU_MUDA = "DCE8F4", NAVY2 = "22345A";
const HEAD = "Cambria", BODY = "Calibri";

// ukuran asli gambar (px) untuk menjaga rasio
const UKURAN = {
  "00_arsitektur.png": [1900, 1036], "00_flowchart.png": [1357, 1924], "01_distribusi_kelas.png": [1800, 600],
  "01_kata_teratas.png": [1950, 750], "02_confusion_matrix.png": [2250, 645], "02_decision_tree.png": [2700, 1050],
  "02_nb_kata_diskriminatif.png": [1800, 750], "02_perbandingan_metrik.png": [1500, 675],
  "03_astar_normal_vs_banjir.png": [1150, 1101], "03_eksplorasi_banjir.png": [2700, 975],
  "03_peta_lingkungan.png": [1192, 1216], "04_elbow.png": [1050, 525], "04_klaster.png": [2250, 900],
  "04_pemilihan_k.png": [2400, 600], "04_rouge.png": [1350, 600],
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13,333 × 7,5 inci
pres.title = "Agen Cerdas Peringkas Laporan Banjir";
pres.author = "Izvio Prijaya Mumin, Fatah Idzhar Hamdi";
pres.subject = "UTS Kecerdasan Artifisial, Tema D: Mesin Peringkasan dan Klasterisasi";
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

const FOOT = "UTS Kecerdasan Artifisial · Agen Cerdas Peringkas Laporan Banjir · Izvio & Fatah";
pres.defineSlideMaster({
  title: "KONTEN",
  background: { color: PUTIH },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.85, fontFace: HEAD, fontSize: 32, bold: true, color: NAVY, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { text: { text: FOOT, options: { x: 0.6, y: 7.0, w: 10, h: 0.3, fontFace: BODY, fontSize: 10, color: ABU, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontFace: BODY, fontSize: 10, color: ABU, align: "right" },
});
pres.defineSlideMaster({
  title: "GELAP",
  background: { color: NAVY },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.4, w: 11.7, h: 1.6, fontFace: HEAD, fontSize: 44, bold: true, color: PUTIH, valign: "top", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.1, w: 11.7, h: 1.4, fontFace: BODY, fontSize: 20, color: "C9D4E3", valign: "top", margin: 0 }, text: "" } },
  ],
});

// ---------- helper ----------
const kotak = (s, x, y, w, h, fill = ABU_MUDA) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.12 });
const teks = (s, t, o) => s.addText(t, { isTextBox: true, fontFace: BODY, fontSize: 16, color: NAVY, margin: 0, valign: "top", ...o });
const bulat = (s, x, y, n, warna = BIRU, d = 0.55) => {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: warna }, line: { color: warna } });
  s.addText(String(n), { isTextBox: true, x, y, w: d, h: d, align: "center", valign: "middle", fontFace: HEAD, fontSize: 18, bold: true, color: PUTIH, margin: 0 });
};
const gambar = (s, f, x, y, maxW, maxH, alt, rata = "tengah") => {
  const [pw, ph] = UKURAN[f];
  let w = maxW, h = (maxW * ph) / pw;
  if (h > maxH) { h = maxH; w = (maxH * pw) / ph; }
  const dx = rata === "tengah" ? (maxW - w) / 2 : 0;
  s.addImage({ path: G(f), x: x + dx, y: y + (maxH - h) / 2, w, h, altText: alt });
};
const tabel = (s, baris, o) => {
  const rows = baris.map((r, i) => r.map((c) => {
    const sel = typeof c === "object" ? c : { text: String(c) };
    const opt = i === 0 ? { bold: true, color: PUTIH, fill: { color: NAVY } } : { color: NAVY, fill: { color: i % 2 ? PUTIH : ABU_MUDA } };
    return { text: sel.text, options: { ...opt, ...(sel.options || {}) } };
  }));
  s.addTable(rows, { fontFace: BODY, fontSize: 14, border: { type: "solid", pt: 0.5, color: GARIS }, valign: "middle", margin: [0.04, 0.08, 0.04, 0.08], ...o });
};
const kanan = (t, extra = {}) => ({ text: t, options: { align: "right", ...extra } });
const sorot = (t, extra = {}) => ({ text: t, options: { bold: true, fill: { color: BIRU_MUDA }, ...extra } });
const konten = (judul, seksi) => { const s = pres.addSlide({ masterName: "KONTEN", sectionTitle: seksi }); s.addText(judul, { placeholder: "title" }); return s; };
const pembatas = (judul, sub, seksi) => {
  const s = pres.addSlide({ masterName: "GELAP", sectionTitle: seksi });
  s.addText(judul, { placeholder: "title" }); s.addText(sub, { placeholder: "body" }); return s;
};

// =================== 1. Pembuka ===================
let S = "Pembuka";
pres.addSection({ title: S });
let s = pres.addSlide({ masterName: "GELAP", sectionTitle: S });
teks(s, "UTS KECERDASAN ARTIFISIAL · TEMA D: MESIN PERINGKASAN & KLASTERISASI", { x: 0.8, y: 0.7, w: 11.7, h: 0.4, fontSize: 14, bold: true, color: ORANYE_MUDA, charSpacing: 2 });
s.addText("Agen Cerdas Peringkas Laporan Banjir", { placeholder: "title", y: 1.7, h: 1.9, fontSize: 48 });
s.addText("Klasterisasi dan peringkasan Hybrid TF-IDF tweet banjir Jabodetabek, dengan rute evakuasi A* (studi kasus Ciledug)", { placeholder: "body", y: 3.6, h: 1.1 });
teks(s, [
  { text: "Izvio Prijaya Mumin (2611600087) · Fatah Idzhar Hamdi (2611600129)", options: { bold: true, color: PUTIH, breakLine: true } },
  { text: "Dosen Pengampu: Dr. Indra, S.Kom, M.T.I", options: { color: "C9D4E3", breakLine: true } },
  { text: "Program Studi Magister Ilmu Komputer · Universitas Budi Luhur · 2026", options: { color: "C9D4E3" } },
], { x: 0.8, y: 5.4, w: 11.7, h: 1.2, fontSize: 16, paraSpaceAfter: 4 });
s.addNotes("Pembuka. Perkenalkan diri dan tema D: mesin peringkasan dan klasterisasi. Satu kalimat inti: agen kami membaca tweet banjir, menyaring laporan dengan Naive Bayes, mengelompokkan 3.390 tweet Jabodetabek menjadi 11 topik, meringkas setiap topik dengan Hybrid TF-IDF, lalu mencari rute evakuasi dengan A* di Ciledug.");

// 2. Latar belakang
s = konten("Saat banjir, laporan penting tenggelam di antara opini", S);
teks(s, [
  { text: "Warga melaporkan kondisi banjir lewat media sosial, sehingga media sosial menjadi sumber informasi situasional yang cepat.", options: { breakLine: true } },
  { text: "Masalahnya, sebagian besar tweet berkata \"banjir\" bukan laporan kejadian: isinya opini, politik, doa, atau kiasan.", options: { breakLine: true } },
  { text: "Petugas tidak sempat membaca ribuan tweet. Dibutuhkan agen yang menyaring, mengelompokkan, meringkas, dan menindaklanjuti.", options: {} },
], { x: 0.6, y: 1.5, w: 5.6, h: 4.6, fontSize: 18, paraSpaceAfter: 14 });
kotak(s, 6.7, 1.5, 6.0, 2.45);
teks(s, "30,2%", { x: 7.0, y: 1.7, w: 5.4, h: 1.0, fontFace: HEAD, fontSize: 60, bold: true, color: BIRU });
teks(s, "Hanya 368 dari 1.220 tweet berlabel yang benar-benar laporan kejadian banjir", { x: 7.0, y: 2.8, w: 5.4, h: 0.9, fontSize: 16 });
kotak(s, 6.7, 4.2, 6.0, 2.45);
teks(s, "20–50 cm", { x: 7.0, y: 4.4, w: 5.4, h: 1.0, fontFace: HEAD, fontSize: 60, bold: true, color: ORANYE });
teks(s, "Genangan di Ciledug, Larangan, dan Karang Tengah yang dicatat BPBD Kota Tangerang (Februari 2026); kawasan dilalui Kali Angke", { x: 7.0, y: 5.5, w: 5.4, h: 1.0, fontSize: 16 });
s.addNotes("Banjir adalah bencana paling sering di Jabodetabek. Ciledug rawan karena topografinya rendah dan dilalui Kali Angke. Di data berlabel, hanya 30 persen tweet yang laporan kejadian. Penelitian terdahulu: Blomeier dkk. 2024 untuk klasifikasi relevansi, Garg dkk. 2024 untuk peringkasan tweet bencana.");

// 3. Rumusan masalah
s = konten("Empat rumusan masalah, empat bagian agen", S);
[
  ["Bagaimana mengenali tweet laporan banjir, dan algoritma supervised mana yang paling optimal (NB, KNN, Decision Tree)?", "BAB III"],
  ["Bagaimana mengelompokkan ribuan tweet banjir menjadi topik kejadian tanpa label?", "BAB IV · Klasterisasi"],
  ["Seberapa baik Hybrid TF-IDF meringkas tiap kelompok dibanding ringkasan manusia dan baseline?", "BAB IV · Peringkasan"],
  ["Bagaimana agen mencari rute evakuasi yang menghindari genangan, dan algoritma searching mana yang paling efisien?", "BAB II"],
].forEach(([q, bab], i) => {
  const x = 0.6 + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 2.65;
  kotak(s, x, y, 5.95, 2.4);
  bulat(s, x + 0.3, y + 0.3, i + 1, i === 3 ? ORANYE : BIRU);
  teks(s, q, { x: x + 1.1, y: y + 0.3, w: 4.55, h: 1.4, fontSize: 17 });
  teks(s, bab, { x: x + 1.1, y: y + 1.8, w: 4.55, h: 0.35, fontSize: 13, bold: true, color: i === 3 ? ORANYE : BIRU });
});
s.addNotes("Empat rumusan masalah ini dijawab satu per satu di kesimpulan. Nomor 2 dan 3 adalah inti tema D. Nomor 1 menjawab ketentuan supervised learning, nomor 4 menjawab ketentuan searching.");

// 4. PEAS dan sifat lingkungan
s = konten("Arsitektur agen: spesifikasi PEAS dan sifat lingkungan", S);
tabel(s, [
  ["Komponen", "Spesifikasi"],
  [{ text: "Performance", options: { bold: true } }, "F1 klasifikasi; ROUGE ringkasan; biaya dan jarak rute; jumlah node diperiksa"],
  [{ text: "Environment", options: { bold: true } }, "Tweet banjir Jabodetabek; jalan Ciledug (OSM); titik genangan BPBD; 65 tempat aman"],
  [{ text: "Actuators", options: { bold: true } }, "Label laporan/bukan; kelompok topik; ringkasan 3 tweet; rute di peta (web)"],
  [{ text: "Sensors", options: { bold: true } }, "Teks dan waktu tweet; data peta; koordinat titik banjir"],
], { x: 0.6, y: 1.5, w: 6.6, colW: [1.6, 5.0], fontSize: 14 });
tabel(s, [
  ["Sifat", "Kategori"],
  ["Observability", "Partially observable"],
  ["Determinism", "Stochastic"],
  ["Episodic/Sequential", "Episodik (klasifikasi), sekuensial (rute)"],
  ["Static/Dynamic", "Dynamic"],
  ["Discrete/Continuous", "Discrete"],
  ["Agents", "Single-agent"],
], { x: 7.6, y: 1.5, w: 5.1, colW: [2.0, 3.1], fontSize: 14 });
teks(s, "Goal-based agent yang juga learning-based: tujuannya laporan situasi ringkas dan rute berbiaya minimum (Russell & Norvig, 2021).", { x: 0.6, y: 4.6, w: 6.6, h: 0.9, fontSize: 15, italic: true, color: ABU });
s.addNotes("Agen goal-based: tujuannya ringkasan situasi dan rute berbiaya minimum, sekaligus learning-based karena perilakunya dipelajari dari data. Partially observable karena banyak kejadian tidak di-tweet dan lokasi sering tidak lengkap. Stochastic karena isi tweet dan genangan tidak bisa diprediksi. Discrete karena jalan dimodelkan sebagai graf persimpangan.");

// 5. Arsitektur sistem
s = konten("Arsitektur sistem: dari notebook ke web", S);
gambar(s, "00_arsitektur.png", 0.6, 1.4, 8.6, 5.4, "Arsitektur sistem: sumber data, empat notebook Python, penyimpanan Supabase dan JSON, serta web Next.js");
kotak(s, 9.5, 1.5, 3.2, 5.2);
teks(s, [
  { text: "Python", options: { bold: true, color: BIRU, breakLine: true } },
  { text: "pandas, scikit-learn, Sastrawi, OSMnx di 4 notebook Colab", options: { breakLine: true } },
  { text: " ", options: { breakLine: true } },
  { text: "Supabase", options: { bold: true, color: BIRU, breakLine: true } },
  { text: "PostgreSQL schema uts_ai_bencana; web hanya membaca (RLS)", options: { breakLine: true } },
  { text: " ", options: { breakLine: true } },
  { text: "Web", options: { bold: true, color: BIRU, breakLine: true } },
  { text: "Next.js di Vercel; model JSON dijalankan di browser", options: {} },
], { x: 9.75, y: 1.75, w: 2.75, h: 4.8, fontSize: 15 });
s.addNotes("Data dari Mendeley, OpenStreetMap, dan berita BPBD diolah di empat notebook. Hasil disimpan di Supabase dan diekspor ke JSON untuk web. Penulisan ke Supabase hanya dari notebook; web memakai publishable key yang hanya boleh SELECT.");

// 6. Diagram alir
s = konten("Diagram alir agen dari tweet masuk sampai rute tampil", S);
gambar(s, "00_flowchart.png", 0.6, 1.35, 4.4, 5.5, "Diagram alir agen: preprocessing, Naive Bayes, TF-IDF dan LSA, K-Means, peringkasan, lalu A* ke tempat aman");
[
  ["Saring", "Naive Bayes memisahkan laporan dari opini", "Notebook 01–02", BIRU],
  ["Kelompokkan", "K-Means membagi 3.390 tweet menjadi 11 topik", "Notebook 04", BIRU],
  ["Ringkas", "Hybrid TF-IDF memilih 3 tweet per topik", "Notebook 04", BIRU],
  ["Tindak lanjut", "A* mencari rute ke tempat aman terdekat, menghindari genangan", "Notebook 03", ORANYE],
].forEach(([j, d, nb, w], i) => {
  const y = 1.45 + i * 1.35;
  kotak(s, 5.4, y, 7.3, 1.2);
  bulat(s, 5.65, y + 0.32, i + 1, w);
  teks(s, j, { x: 6.45, y: y + 0.15, w: 4.2, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true });
  teks(s, d, { x: 6.45, y: y + 0.58, w: 4.4, h: 0.5, fontSize: 14 });
  teks(s, nb, { x: 10.9, y: y + 0.15, w: 1.6, h: 0.4, fontSize: 12, color: ABU, align: "right" });
});
s.addNotes("Empat langkah utama agen. Percabangan di diagram: kalau klaster punya minimal 10 tweet laporan, hanya tweet laporan yang diringkas supaya hasilnya laporan situasi; kalau tidak, semua tweet klaster diringkas.");

// =================== 2. Data & klasifikasi ===================
S = "Data dan klasifikasi";
pres.addSection({ title: S });
s = pembatas("Data dan klasifikasi laporan", "BAB III · Supervised learning: Naive Bayes vs KNN vs Decision Tree", S);
s.addNotes("Masuk ke bagian data dan klasifikasi.");

// 8. Dataset
s = konten("Dua himpunan dari satu dataset publik", S);
kotak(s, 0.6, 1.45, 5.95, 2.75);
teks(s, "Berlabel → klasifikasi", { x: 0.9, y: 1.6, w: 5.4, h: 0.45, fontFace: HEAD, fontSize: 19, bold: true, color: BIRU });
teks(s, [
  { text: "1.250 tweet banjir − 30 tweet Melayu = ", options: {} },
  { text: "1.220 tweet", options: { bold: true, breakLine: true } },
  { text: "368 laporan (FLOOD-EVENT) · 852 bukan laporan (FALSE-EVENT)", options: { breakLine: true } },
  { text: "Label per token diturunkan ke label per tweet; split stratified 80:20 (976 latih, 244 uji)", options: {} },
], { x: 0.9, y: 2.15, w: 5.4, h: 1.95, fontSize: 15, paraSpaceAfter: 6 });
kotak(s, 6.75, 1.45, 5.95, 2.75);
teks(s, "Mentah → klaster dan ringkas", { x: 7.05, y: 1.6, w: 5.4, h: 0.45, fontFace: HEAD, fontSize: 19, bold: true, color: BIRU });
teks(s, [
  { text: "43.018 tweet banjir 2018–2023", options: { breakLine: true } },
  { text: "→ 3.491 menyebut wilayah Jabodetabek", options: { breakLine: true } },
  { text: "→ 3.444 tanpa tweet Melayu dan Inggris", options: { breakLine: true } },
  { text: "→ 3.390 unik, minimal 3 kata bermakna", options: { bold: true } },
], { x: 7.05, y: 2.15, w: 5.4, h: 1.95, fontSize: 15, paraSpaceAfter: 4 });
gambar(s, "01_distribusi_kelas.png", 0.6, 4.4, 8.2, 2.5, "Distribusi kelas laporan dan bukan laporan serta panjang tweet");
teks(s, "Ariyanto dkk. (2025), Data in Brief 61, 111688. Dua anotator, Fleiss’ Kappa > 0,80. Kami hanya memakai teks bahasa Indonesia; terjemahan Inggris bawaan dataset tidak dipakai.", { x: 9.0, y: 4.6, w: 3.7, h: 2.2, fontSize: 13, color: ABU });
s.addNotes("Satu dataset, dua file. File berlabel untuk klasifikasi: labelnya per token, jadi kami turunkan ke tingkat tweet; tweet yang punya token FLOOD-EVENT dianggap laporan. File mentah 43 ribu tweet kami saring ke Jabodetabek untuk klasterisasi. Tidak ada mesin penerjemah: kolom Inggris adalah bawaan dataset dan tidak kami pakai; tweet berbahasa Melayu dan Inggris justru disaring keluar. Kelas tidak seimbang 30 banding 70, karena itu split stratified.");

// 9. Pra-pemrosesan
s = konten("Pra-pemrosesan teks: satu modul untuk seluruh proyek", S);
[
  ["Case folding", "semua huruf menjadi kecil"],
  ["Cleaning", "hapus URL, mention, #, tanda baca; angka → token \"angka\""],
  ["Normalisasi slang", "kata tidak baku ke bentuk baku (gak → tidak)"],
  ["Stopword removal", "daftar Sastrawi, kecuali tidak, belum, masih, sudah, tinggi"],
  ["Stemming", "Nazief–Adriani (Sastrawi), lalu stopword dibuang lagi"],
].forEach(([j, d], i) => {
  const y = 1.45 + i * 1.05;
  bulat(s, 0.6, y + 0.12, i + 1, BIRU, 0.5);
  teks(s, j, { x: 1.3, y: y + 0.02, w: 4.6, h: 0.38, fontSize: 17, bold: true });
  teks(s, d, { x: 1.3, y: y + 0.42, w: 4.6, h: 0.5, fontSize: 14, color: ABU });
});
gambar(s, "01_kata_teratas.png", 6.2, 1.45, 6.5, 3.2, "Kata paling sering pada kelas laporan dan bukan laporan setelah pra-pemrosesan");
kotak(s, 6.2, 4.95, 6.5, 1.75);
teks(s, [
  { text: "Kenapa angka diganti token? ", options: { bold: true } },
  { text: "Laporan sering memuat angka (\"air 50 cm\", \"RT 03\"). Nilainya tidak penting, tetapi kehadirannya adalah ciri laporan. Kode: notebooks/teks.py, dipakai ulang oleh web (lib/teks.ts).", options: {} },
], { x: 6.45, y: 5.15, w: 6.0, h: 1.4, fontSize: 14 });
s.addNotes("Lima langkah pra-pemrosesan, satu modul kode untuk semua notebook dan ditiru oleh web. Kata negasi dan keadaan seperti tidak, belum, masih dipertahankan karena penting untuk makna banjir, misalnya air belum surut. Stemming mengikuti Saraswati dkk. 2025.");

// 10. Hasil klasifikasi
s = konten("Naive Bayes paling optimal untuk menyaring laporan", S);
tabel(s, [
  ["Model", kanan("Akurasi"), kanan("Presisi"), kanan("Recall"), kanan("F1 uji"), kanan("F1 CV (± std)")],
  [sorot("Naive Bayes"), sorot("0,766", { align: "right" }), sorot("0,616", { align: "right" }), sorot("0,608", { align: "right" }), sorot("0,612", { align: "right" }), sorot("0,687 ± 0,025", { align: "right" })],
  ["KNN", kanan("0,754"), kanan("0,609"), kanan("0,527"), kanan("0,565"), kanan("0,585 ± 0,044")],
  ["Decision Tree", kanan("0,672"), kanan("0,467"), kanan("0,581"), kanan("0,518"), kanan("0,518 ± 0,058")],
], { x: 0.6, y: 1.5, w: 7.2, colW: [1.7, 1.0, 1.0, 1.0, 1.0, 1.5], fontSize: 14 });
teks(s, [
  { text: "Fitur: ", options: { bold: true } }, { text: "TF-IDF unigram + bigram, min_df 2, sublinear tf (2.851 fitur)", options: { breakLine: true } },
  { text: "Tuning: ", options: { bold: true } }, { text: "GridSearchCV 5-fold stratified, metrik F1 karena kelas 30:70", options: { breakLine: true } },
  { text: "Seleksi: ", options: { bold: true } }, { text: "model terbaik dipilih dari F1 CV, bukan dari data uji", options: { breakLine: true } },
  { text: "Parameter NB: ", options: { bold: true } }, { text: "alpha = 0,1, fit_prior = False (prior seragam menaikkan recall laporan)", options: {} },
], { x: 0.6, y: 3.6, w: 7.2, h: 2.4, fontSize: 15, paraSpaceAfter: 6 });
gambar(s, "02_perbandingan_metrik.png", 8.1, 1.5, 4.6, 3.0, "Perbandingan akurasi, presisi, recall, dan F1 tiga model");
kotak(s, 8.1, 4.75, 4.6, 1.95);
teks(s, "F1 ≈ 0,6 tergolong moderat: data latih laporan hanya 294, banyak tweet kiasan, dan label diturunkan dari anotasi per token.", { x: 8.35, y: 4.95, w: 4.1, h: 1.6, fontSize: 14 });
s.addNotes("Kami memakai F1, bukan akurasi, karena model yang selalu menjawab bukan laporan sudah mendapat akurasi 70 persen. Naive Bayes menang di F1 CV 0,687 dan F1 uji 0,612. KNN kesulitan pada vektor teks yang sangat jarang; Decision Tree cenderung overfit pada kata spesifik. Hasil sejalan dengan Airlangga 2024 dan Gorat dkk. 2026.");

// 11. Confusion matrix
s = konten("Confusion matrix ketiga model pada 244 tweet uji", S);
gambar(s, "02_confusion_matrix.png", 0.6, 1.4, 12.1, 3.5, "Confusion matrix Naive Bayes, KNN, dan Decision Tree pada data uji");
[
  ["Naive Bayes", "Presisi dan recall seimbang (0,616 / 0,608): salah tebak dua arah kurang lebih sama banyak"],
  ["KNN", "Recall paling rendah (0,527): banyak laporan lolos sebagai bukan laporan"],
  ["Decision Tree", "Presisi paling rendah (0,467): banyak opini ditebak sebagai laporan"],
].forEach(([j, d], i) => {
  const x = 0.6 + i * 4.1;
  kotak(s, x, 5.15, 3.9, 1.6);
  teks(s, j, { x: x + 0.25, y: 5.3, w: 3.4, h: 0.4, fontSize: 16, bold: true, color: i === 0 ? BIRU : NAVY });
  teks(s, d, { x: x + 0.25, y: 5.72, w: 3.4, h: 0.95, fontSize: 13 });
});
s.addNotes("Baca confusion matrix: baris adalah label asli, kolom tebakan. Naive Bayes paling seimbang. KNN banyak melewatkan laporan, Decision Tree banyak salah menandai opini sebagai laporan.");

// 12. NB kata diskriminatif + DT
s = konten("Isi model: kata pendorong dan Decision Tree", S);
gambar(s, "02_nb_kata_diskriminatif.png", 0.6, 1.4, 6.0, 3.4, "Kata paling diskriminatif menurut Naive Bayes untuk kelas laporan dan bukan laporan");
gambar(s, "02_decision_tree.png", 6.8, 1.4, 5.9, 3.4, "Tiga level teratas Decision Tree");
kotak(s, 0.6, 5.0, 6.0, 1.75);
teks(s, "Naive Bayes: P(c | d) ∝ P(c) · Π P(wᵢ | c). Kata pendorong laporan antara lain ‘belum surut’ dan ‘rumah warga’; pendorong bukan laporan antara lain ‘presiden’ dan ‘jokowi’.", { x: 0.85, y: 5.2, w: 5.5, h: 1.4, fontSize: 14 });
kotak(s, 6.8, 5.0, 5.9, 1.75);
teks(s, "Membentuk pohon = pencarian greedy: state = node berisi subset data, action = memilih fitur, heuristik = information gain terbesar, goal = node murni.", { x: 7.05, y: 5.2, w: 5.4, h: 1.4, fontSize: 14 });
s.addNotes("Kiri: kata yang paling membedakan kelas menurut Naive Bayes. Kanan: tiga level teratas Decision Tree. Ini juga menghubungkan BAB III ke konsep searching di BAB II: pembentukan pohon adalah pencarian greedy dengan heuristik information gain.");

// =================== 3. Klasterisasi & peringkasan ===================
S = "Klasterisasi dan peringkasan";
pres.addSection({ title: S });
s = pembatas("Klasterisasi dan mesin peringkasan", "BAB IV · Inti tema D: TF-IDF + LSA, K-Means, Hybrid TF-IDF, ROUGE", S);
s.addNotes("Masuk ke inti tema kelompok kami.");

// 14. Representasi
s = konten("Dari teks ke vektor: TF-IDF, lalu LSA 100 dimensi", S);
[
  ["Korpus", "3.390 tweet Jabodetabek, pra-pemrosesan sama dengan BAB III"],
  ["Label otomatis", "Naive Bayes menandai 539 tweet (15,9%) sebagai laporan, untuk menilai klaster, bukan membuang data"],
  ["TF-IDF", "unigram, min_df 3, max_df 0,5 → 2.665 kata"],
  ["LSA", "TruncatedSVD ke 100 topik laten (26,4% variansi), normalisasi L2"],
  ["Klasterisasi", "K-Means vs Agglomerative Ward, k = 3–20"],
].forEach(([j, d], i) => {
  const x = 0.6 + i * 2.48;
  kotak(s, x, 1.55, 2.3, 3.1, i === 4 ? BIRU_MUDA : ABU_MUDA);
  bulat(s, x + 0.2, 1.75, i + 1, BIRU, 0.5);
  teks(s, j, { x: x + 0.2, y: 2.4, w: 1.95, h: 0.45, fontSize: 17, bold: true });
  teks(s, d, { x: x + 0.2, y: 2.9, w: 1.95, h: 1.65, fontSize: 13 });
});
kotak(s, 0.6, 4.95, 12.1, 1.8);
teks(s, [
  { text: "Kenapa LSA dan L2? ", options: { bold: true, color: BIRU } },
  { text: "Vektor TF-IDF 2.665 dimensi hampir semuanya nol. LSA menggabungkan kata yang sering muncul bersama menjadi topik laten, sehingga tweet bertema sama jadi berdekatan. Setelah normalisasi L2, jarak Euclidean setara dengan jarak cosine, ukuran standar untuk teks, sehingga cocok untuk K-Means.", options: {} },
], { x: 0.85, y: 5.15, w: 11.6, h: 1.45, fontSize: 15 });
s.addNotes("Label Naive Bayes adalah jembatan BAB III ke BAB IV: tidak dipakai untuk membuang tweet, tetapi untuk menghitung persen laporan per klaster. LSA dipakai karena TF-IDF sangat jarang; topik laten membuat sinonim berdekatan.");

// 15. Pemilihan k
s = konten("K-Means unggul; k = 11 dipilih dengan metode elbow", S);
gambar(s, "04_pemilihan_k.png", 0.6, 1.35, 12.1, 3.05, "Silhouette, Davies-Bouldin, dan inertia untuk k 3 sampai 20");
tabel(s, [
  ["Pada k = 11", kanan("Silhouette ↑"), kanan("Davies-Bouldin ↓"), kanan("Calinski-Harabasz ↑")],
  [sorot("K-Means"), sorot("0,0695", { align: "right" }), sorot("3,966", { align: "right" }), sorot("44,9", { align: "right" })],
  ["Agglomerative Ward", kanan("0,0135"), kanan("4,655"), kanan("30,2")],
], { x: 0.6, y: 4.65, w: 7.0, colW: [2.2, 1.5, 1.6, 1.7], fontSize: 14 });
kotak(s, 7.9, 4.6, 4.8, 2.15);
teks(s, "Silhouette pada teks pendek terus naik seiring k, jadi tidak bisa dipakai memilih k. Titik siku kurva inertia dicari otomatis dengan algoritma kneedle: k = 11.", { x: 8.15, y: 4.8, w: 4.3, h: 1.85, fontSize: 14 });
s.addNotes("Tiga metrik: silhouette makin tinggi makin baik, Davies-Bouldin makin rendah makin baik, Calinski-Harabasz makin tinggi makin baik. K-Means unggul silhouette di 100 persen nilai k. Silhouette 0,07 kecil karena topik tweet tumpang tindih; ini keterbatasan yang kami akui.");

// 16. Reproducibility
s = konten("Hasil klaster Colab dan laptop sempat berbeda, kini identik", S);
kotak(s, 0.6, 1.5, 5.4, 3.3);
teks(s, "Inisialisasi acak (k-means++)", { x: 0.9, y: 1.7, w: 4.8, h: 0.4, fontSize: 15, color: ABU });
teks(s, "ARI 0,58", { x: 0.9, y: 2.15, w: 4.8, h: 1.1, fontFace: HEAD, fontSize: 60, bold: true, color: ORANYE });
teks(s, "Selisih pembulatan CPU sekitar 1e-9 sudah cukup menghasilkan klaster lain; dua run acak hanya sepakat ARI 0,4–0,6", { x: 0.9, y: 3.4, w: 4.8, h: 1.2, fontSize: 15 });
s.addShape(pres.shapes.RIGHT_ARROW, { x: 6.2, y: 2.85, w: 0.9, h: 0.6, fill: { color: BIRU }, line: { color: BIRU } });
kotak(s, 7.3, 1.5, 5.4, 3.3, BIRU_MUDA);
teks(s, "Centroid awal dari Agglomerative Ward", { x: 7.6, y: 1.7, w: 4.8, h: 0.4, fontSize: 15, color: ABU });
teks(s, "ARI 1,0", { x: 7.6, y: 2.15, w: 4.8, h: 1.1, fontFace: HEAD, fontSize: 60, bold: true, color: BIRU });
teks(s, "Ward deterministik, lalu disempurnakan iterasi Lloyd; stabil pada uji gangguan numerik 1e-12 sampai 1e-6", { x: 7.6, y: 3.4, w: 4.8, h: 1.2, fontSize: 15 });
teks(s, [
  { text: "Pengaman tambahan: ", options: { bold: true } },
  { text: "versi pustaka dikunci (requirements.txt), satu thread, kernel BLAS tetap, sidik korpus dan fitur dicek setiap run terhadap label acuan (data/reference/label_klaster_acuan.json).", options: { breakLine: true } },
  { text: "ARI (Adjusted Rand Index): ", options: { bold: true } },
  { text: "kesamaan dua pembagian kelompok, 1 = identik, 0 = setara acak.", options: {} },
], { x: 0.6, y: 5.1, w: 12.1, h: 1.6, fontSize: 15, paraSpaceAfter: 6 });
s.addNotes("Temuan menarik saat implementasi. Data ini punya banyak solusi K-Means dengan inertia hampir sama, sehingga gangguan sekecil pembulatan CPU membuat algoritma jatuh ke solusi lain. Solusinya: centroid awal K-Means diambil dari rata-rata klaster Ward, fungsi kmeans_ward di notebook 4. Sekarang Colab dan laptop identik, ARI 1,0.");

// 17. Sebaran klaster
s = konten("Sebaran 11 klaster dan proporsi laporan per klaster", S);
gambar(s, "04_klaster.png", 0.6, 1.35, 12.1, 4.75, "Sebaran tweet per klaster dalam proyeksi 2D dan persen tweet yang diprediksi laporan per klaster");
teks(s, "Klaster yang menyebut wilayah (Tangerang 75,7%, Bekasi 35,0%, Jakarta 31,3%) berisi laporan kejadian; klaster tokoh dan proyek (Anies 0,6%, bendungan Ciawi 0,0%) berisi opini dan perdebatan politik.", { x: 0.6, y: 6.2, w: 12.1, h: 0.7, fontSize: 14, color: ABU });
s.addNotes("Kiri: proyeksi 2D tweet berwarna per klaster; batasnya kabur, sesuai silhouette yang rendah. Kanan: persen tweet yang diprediksi laporan oleh Naive Bayes. Inilah gunanya label otomatis: membedakan klaster kejadian dari klaster opini.");

// 18. Profil klaster
s = konten("Profil 11 klaster, urut dari proporsi laporan tertinggi", S);
const prof = [
  ["10", "140", "75,7%", "tangerang, angka, kota, kabupaten, rumah, malam", "Laporan banjir Tangerang"],
  ["2", "177", "35,0%", "bekas, angka, rumah, hujan, kota, tidak", "Laporan banjir Bekasi"],
  ["5", "562", "31,3%", "angka, jalan, tidak, hujan, tahun, hari", "Genangan jalan Jakarta"],
  ["0", "200", "18,0%", "bogor, bantu, korban, longsor, bandang, angka", "Bogor: bandang, longsor"],
  ["4", "241", "12,0%", "air, angka, mata, tidak, tanah, laut", "Air, tanah, laut"],
  ["6", "217", "11,5%", "ciliwung, sungai, kali, angka, normalisasi, sodet", "Ciliwung, normalisasi"],
  ["1", "1.190", "8,1%", "tidak, gubernur, hujan, sudah, warga, pak", "Opini umum, gubernur"],
  ["7", "205", "2,9%", "macet, presiden, atas, mudah, tidak, lebih", "Presiden, macet"],
  ["8", "63", "1,6%", "resap, sumur, buat, angka, bangun, cegah", "Sumur resapan"],
  ["3", "343", "0,6%", "anies, angka, baswedan, tidak, kerja, gubernur", "Anies Baswedan"],
  ["9", "52", "0,0%", "bendung, ciawi, sukamahi, rampung, kendali, bangun", "Bendungan Ciawi–Sukamahi"],
];
tabel(s, [["Klaster", kanan("Tweet"), kanan("% laporan"), "Kata kunci", "Tema"],
  ...prof.map((r, i) => i < 3 ? [sorot(r[0]), sorot(r[1], { align: "right" }), sorot(r[2], { align: "right" }), sorot(r[3], { bold: false }), sorot(r[4])] : [r[0], kanan(r[1]), kanan(r[2]), r[3], r[4]])],
  { x: 0.6, y: 1.4, w: 12.1, colW: [1.0, 1.0, 1.3, 5.6, 3.2], fontSize: 13, rowH: 0.42 });
s.addNotes("Tiga klaster teratas berisi laporan kejadian di Tangerang, Bekasi, dan Jakarta. Klaster 1 paling besar karena menampung opini umum tanpa kata khas. Kata bekas muncul karena stemmer Sastrawi memotong bekasi; itu keterbatasan stemmer.");

// 19. Hybrid TF-IDF
s = konten("Hybrid TF-IDF: 3 tweet paling mewakili per klaster", S);
kotak(s, 0.6, 1.5, 6.0, 1.35, BIRU_MUDA);
teks(s, "S(t) = Σ TF(w) · IDF(w) / max(11, |t|)", { x: 0.85, y: 1.6, w: 5.5, h: 1.15, fontFace: HEAD, fontSize: 20, bold: true, valign: "middle", align: "center" });
teks(s, [
  { text: "TF(w): ", options: { bold: true } }, { text: "frekuensi w di semua tweet digabung / total kata", options: { breakLine: true } },
  { text: "IDF(w): ", options: { bold: true } }, { text: "log₂(N / jumlah tweet yang memuat w)", options: { breakLine: true } },
  { text: "Hybrid: ", options: { bold: true } }, { text: "TF atas seluruh kumpulan, IDF per tweet (Sharifi dkk., 2010)", options: { breakLine: true } },
  { text: "max(11, |t|): ", options: { bold: true } }, { text: "mencegah tweet panjang selalu menang", options: { breakLine: true } },
  { text: "Redundansi: ", options: { bold: true } }, { text: "tweet dengan cosine > 0,77 terhadap yang terpilih dilewati", options: { breakLine: true } },
  { text: "Laporan dulu: ", options: { bold: true } }, { text: "klaster dengan ≥ 10 tweet laporan hanya meringkas tweet laporan", options: {} },
], { x: 0.6, y: 3.1, w: 6.0, h: 3.6, fontSize: 15, paraSpaceAfter: 6 });
kotak(s, 6.9, 1.5, 5.8, 5.25);
teks(s, "Contoh ringkasan klaster 10 (140 tweet, 75,7% laporan)", { x: 7.15, y: 1.65, w: 5.3, h: 0.7, fontSize: 16, bold: true, color: BIRU });
teks(s, [
  { text: "[2022-12-30] Kondisi banjir genangi kawasan industri Olex Balaraja Kabupaten Tangerang Jumat (30/12/2022) sekitar pukul 17.00 WIB.", options: { bullet: true, breakLine: true } },
  { text: "[2022-09-26] Banjir melanda beberapa wilayah Tangerang akibat hujan deras Senin (26/9/2022) malam.", options: { bullet: true, breakLine: true } },
  { text: "[2019-05-15] Pasca banjir muncul ular sepanjang 4,5 meter di Perumahan Binong Permai Blok B Curug Kabupaten Tangerang.", options: { bullet: true } },
], { x: 7.15, y: 2.45, w: 5.3, h: 4.1, fontSize: 14, paraSpaceAfter: 10 });
s.addNotes("Hybrid TF-IDF dirancang untuk teks pendek. Tweet terlalu pendek untuk punya TF yang berarti, jadi TF dihitung atas seluruh kumpulan, sedangkan IDF per tweet. Ringkasannya ekstraktif: memilih tweet asli. Kode di notebooks/ringkas.py, dan di web lib/hybridTfidf.ts.");

// 20. ROUGE
s = konten("Evaluasi ROUGE dan uji Wilcoxon", S);
gambar(s, "04_rouge.png", 0.6, 1.35, 6.4, 2.85, "Skor ROUGE ringkasan sistem terhadap acuan manusia");
tabel(s, [
  ["Metode", kanan("R-1"), kanan("R-2"), kanan("R-L")],
  [sorot("Hybrid TF-IDF"), sorot("0,176", { align: "right" }), sorot("0,029", { align: "right" }), sorot("0,118", { align: "right" })],
  ["TF-IDF standar", kanan("0,149"), kanan("0,029"), kanan("0,098")],
  ["Acak (rata-rata 20×)", kanan("0,174"), kanan("0,028"), kanan("0,119")],
  ["Antar-anotator (Izvio vs Fatah)", kanan("0,298"), kanan("0,057"), kanan("0,164")],
], { x: 0.6, y: 4.35, w: 6.4, colW: [3.1, 1.1, 1.1, 1.1], fontSize: 13 });
tabel(s, [
  ["Wilcoxon: Hybrid vs", "Metrik", kanan("Unggul"), kanan("p")],
  ["Acak", "ROUGE-1", kanan("5/10"), kanan("0,770")],
  ["Acak", "ROUGE-2", kanan("3/10"), kanan("0,492")],
  ["Acak", "ROUGE-L", kanan("6/10"), kanan("1,000")],
  ["TF-IDF standar", "ROUGE-1", kanan("6/10"), kanan("0,160")],
  ["TF-IDF standar", "ROUGE-2", kanan("6/10"), kanan("0,770")],
  ["TF-IDF standar", "ROUGE-L", kanan("6/10"), kanan("0,160")],
], { x: 7.3, y: 1.4, w: 5.4, colW: [1.9, 1.3, 1.1, 1.1], fontSize: 13 });
kotak(s, 7.3, 4.6, 5.4, 1.35);
teks(s, "10 set × 25 tweet dikunci; acuan ditulis kedua anggota secara terpisah, tanpa AI. Tidak ada selisih signifikan pada α = 0,05.", { x: 7.55, y: 4.75, w: 4.9, h: 1.1, fontSize: 14 });
s.addNotes("ROUGE-1 dan 2 mengukur tumpang tindih unigram dan bigram, ROUGE-L urutan kata sama terpanjang. Wilcoxon signed-rank dipakai karena data berpasangan dan hanya 10 set. Hybrid unggul dari TF-IDF standar di 6 dari 10 set, sesuai teori normalisasi panjang, tetapi setara dengan acak.");

// 21. Pembahasan
s = konten("Kenapa Hybrid TF-IDF setara dengan pemilihan acak?", S);
[
  ["Topik seragam", "Set evaluasi diambil dari satu klaster, sehingga tiga tweet acak pun sudah mewakili topik."],
  ["Abstraktif vs ekstraktif", "Acuan ditulis dengan kalimat sendiri, sistem memilih tweet utuh, sehingga kata yang sama jarang muncul."],
  ["Batas atas rendah", "Dua manusia saja hanya sepakat ROUGE-1 0,298: meringkas tweet bercampur memang subjektif."],
  ["Daya uji kecil", "Dengan 10 set, selisih kecil sulit terbukti signifikan secara statistik."],
].forEach(([j, d], i) => {
  const x = 0.6 + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 2.4;
  kotak(s, x, y, 5.95, 2.15);
  bulat(s, x + 0.3, y + 0.3, i + 1, ORANYE);
  teks(s, j, { x: x + 1.1, y: y + 0.3, w: 4.6, h: 0.45, fontSize: 18, bold: true });
  teks(s, d, { x: x + 1.1, y: y + 0.85, w: 4.6, h: 1.15, fontSize: 15 });
});
teks(s, "Yang terbukti: normalisasi panjang bekerja sesuai teori, karena TF-IDF standar condong memilih tweet panjang (Garg dkk., 2024; Gurning dkk., 2025).", { x: 0.6, y: 6.35, w: 12.1, h: 0.5, fontSize: 14, italic: true, color: ABU });
s.addNotes("Sampaikan dengan percaya diri, jangan defensif. Hasil negatif yang jujur tetap bernilai. Saran perbaikannya ada di BAB V: set lintas klaster dan lebih banyak anotator.");

// =================== 4. Rute evakuasi ===================
S = "Rute evakuasi";
pres.addSection({ title: S });
s = pembatas("Tindak lanjut: rute evakuasi", "BAB II · Problem solving by searching: BFS, DFS, UCS, A*", S);
s.addNotes("Masuk ke bagian searching.");

// 23. State space
s = konten("Rute evakuasi sebagai pencarian state space", S);
tabel(s, [
  ["Komponen", "Definisi"],
  [{ text: "State", options: { bold: true } }, "Persimpangan jalan (node graf OpenStreetMap)"],
  [{ text: "Initial state", options: { bold: true } }, "Node terdekat dari lokasi laporan banjir"],
  [{ text: "Actions", options: { bold: true } }, "Pindah ke persimpangan tetangga lewat ruas yang bisa dilalui mobil (ikut arah satu arah)"],
  [{ text: "Transition", options: { bold: true } }, "Result(s, a) = persimpangan di ujung ruas yang dipilih"],
  [{ text: "Goal test", options: { bold: true } }, "Salah satu dari 65 tempat aman di luar radius genangan"],
  [{ text: "Path cost", options: { bold: true } }, "Σ panjang ruas (m), × 20 bila ruas tergenang"],
], { x: 0.6, y: 1.45, w: 7.4, colW: [1.7, 5.7], fontSize: 14 });
kotak(s, 8.3, 1.45, 4.4, 2.6, BIRU_MUDA);
teks(s, [
  { text: "A*: f(n) = g(n) + h(n)", options: { bold: true, fontFace: HEAD, fontSize: 20, breakLine: true } },
  { text: "h(n) = min haversine(n, g) ke tempat aman terdekat. Admissible karena biaya ruas ≥ panjang ruas ≥ jarak garis lurus, jadi A* dijamin optimal.", options: { fontSize: 14 } },
], { x: 8.55, y: 1.65, w: 3.9, h: 2.3, paraSpaceAfter: 8 });
kotak(s, 8.3, 4.25, 4.4, 2.5);
teks(s, [
  { text: "Kenapa penalti × 20, bukan ditutup? ", options: { bold: true } },
  { text: "Genangan 20–50 cm masih bisa dilalui kendaraan darurat dengan pelan. Agen menghindarinya, tetapi tetap punya solusi bila titik awal ada di dalam genangan.", options: {} },
], { x: 8.55, y: 4.45, w: 3.9, h: 2.15, fontSize: 14 });
teks(s, "Pembanding: BFS dan DFS (uninformed), UCS (optimal, patokan). Biaya A* dan UCS dicocokkan dengan Dijkstra networkx pada 20 pasangan acak.", { x: 0.6, y: 5.75, w: 7.4, h: 0.9, fontSize: 14, color: ABU });
s.addNotes("Formulasi state space sesuai Russell dan Norvig. Heuristik admissible karena tidak pernah melebihi biaya sebenarnya; minimum dari heuristik admissible ke 65 tujuan tetap admissible. Implementasi diverifikasi terhadap Dijkstra pustaka networkx. Referensi: Hanafi dkk. 2025, Pratama 2024.");

// 24. Lingkungan pencarian
s = konten("Lingkungan pencarian: jalan Ciledug radius 4,5 km", S);
gambar(s, "03_peta_lingkungan.png", 0.6, 1.35, 5.6, 5.5, "Peta jaringan jalan Ciledug dengan ruas tergenang berwarna biru dan tempat aman berwarna hijau");
const angkaBesar = [["19.066", "persimpangan"], ["43.689", "ruas berarah"], ["717", "ruas tergenang"], ["65", "tempat aman"]];
angkaBesar.forEach(([a, l], i) => {
  const x = 6.5 + (i % 2) * 3.15, y = 1.45 + Math.floor(i / 2) * 1.3;
  kotak(s, x, y, 3.0, 1.15);
  teks(s, a, { x: x + 0.2, y: y + 0.1, w: 2.6, h: 0.6, fontFace: HEAD, fontSize: 28, bold: true, color: i === 2 ? ORANYE : BIRU });
  teks(s, l, { x: x + 0.2, y: y + 0.72, w: 2.6, h: 0.35, fontSize: 13, color: ABU });
});
tabel(s, [
  ["Titik genangan (BPBD Kota Tangerang)", kanan("Radius")],
  ["Perumahan Ciledug Indah", kanan("250 m")],
  ["Komplek Puri Kartika, Tajur", kanan("200 m")],
  ["Komplek Griya Kencana", kanan("200 m")],
  ["Komplek Taman Asri, Cipadu", kanan("200 m")],
  ["Kreo, Larangan", kanan("300 m")],
  ["Jalan Inpres Raya, Gaga", kanan("150 m")],
  ["Jalan Raden Saleh Raya, Karang Mulya", kanan("150 m")],
], { x: 6.5, y: 4.15, w: 6.15, colW: [4.95, 1.2], fontSize: 12, rowH: 0.31 });
s.addNotes("Jalan mobil dalam radius 4,5 km dari Kantor Kecamatan Ciledug, diambil dengan OSMnx (Boeing 2017). Tujuh titik genangan dari pemberitaan BPBD, dimodelkan sebagai lingkaran 150 sampai 300 meter, sehingga 717 ruas ditandai tergenang. Tempat aman: rumah sakit, klinik, damkar, polisi, kantor pemerintahan.");

// 25. Studi kasus eksplorasi
s = konten("Studi kasus Jl. Raden Saleh Raya: jejak penjelajahan", S);
gambar(s, "03_eksplorasi_banjir.png", 0.6, 1.35, 12.1, 4.4, "Perbandingan eksplorasi BFS, DFS, dan A* dari Jalan Raden Saleh Raya pada skenario banjir");
[
  ["BFS", "8 node, rute 0,23 km lewat genangan: hanya menghitung langkah", NAVY],
  ["DFS", "232 node, rute 13,07 km: menyusuri cabang tanpa arah", NAVY],
  ["A*", "109 node, rute 1,73 km bebas genangan: terarah oleh heuristik", ORANYE],
].forEach(([j, d, w], i) => {
  const x = 0.6 + i * 4.1;
  kotak(s, x, 5.85, 3.9, 0.95);
  teks(s, [{ text: j + "  ", options: { bold: true, color: w } }, { text: d, options: {} }], { x: x + 0.2, y: 5.93, w: 3.5, h: 0.8, fontSize: 13, valign: "middle" });
});
s.addNotes("Titik Raden Saleh dipilih otomatis karena rutenya paling berubah saat informasi genangan dipakai. Titik oranye adalah node yang di-expand. BFS cepat tetapi lewat genangan; DFS berputar 13 km; A* memeriksa 109 node dan menemukan rute bebas genangan.");

// 26. Normal vs banjir
s = konten("Informasi genangan mengubah rute evakuasi secara nyata", S);
gambar(s, "03_astar_normal_vs_banjir.png", 0.6, 1.35, 5.9, 5.5, "Rute A* tanpa dan dengan informasi genangan dari Jalan Raden Saleh Raya");
kotak(s, 6.9, 1.5, 5.8, 2.3, BIRU_MUDA);
teks(s, "0,23 km → 1,73 km", { x: 7.15, y: 1.7, w: 5.3, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: ORANYE });
teks(s, "Tanpa info genangan, tempat aman terdekat hanya 228 m tetapi jalurnya tergenang. Dengan penalti, A* memilih tempat aman lain yang bebas genangan.", { x: 7.15, y: 2.65, w: 5.3, h: 1.05, fontSize: 14 });
tabel(s, [
  ["Rata-rata 7 titik banjir", kanan("Normal: m"), kanan("Normal: node"), kanan("Banjir: m"), kanan("Banjir: node")],
  ["BFS", kanan("1.278"), kanan("621,4"), kanan("1.278"), kanan("621,4")],
  ["DFS", kanan("10.408"), kanan("290,4"), kanan("10.408"), kanan("290,4")],
  ["UCS", kanan("1.146"), kanan("691,3"), kanan("1.470"), kanan("554,7")],
  [sorot("A*"), sorot("1.146", { align: "right" }), sorot("161,0", { align: "right" }), sorot("1.470", { align: "right" }), sorot("135,6", { align: "right" })],
], { x: 6.9, y: 4.05, w: 5.8, colW: [1.6, 1.0, 1.1, 1.0, 1.1], fontSize: 12 });
teks(s, "Menghindari genangan menambah jarak A* rata-rata 324 m. BFS dan DFS tidak berubah karena tidak memakai biaya.", { x: 6.9, y: 6.2, w: 5.8, h: 0.6, fontSize: 13, color: ABU });
s.addNotes("Kiri: rute A* sebelum dan sesudah informasi genangan. Pada 7 titik banjir, A* memeriksa node sekitar 4,1 kali lebih sedikit dari UCS; angka 4,1 ini yang muncul di beranda web. BFS dan DFS sama di kedua skenario karena tidak memakai biaya ruas.");

// 27. Benchmark 50 pasangan (chart native)
s = konten("Benchmark 50 pasangan acak: A* 3,4× lebih efisien", S);
s.addChart(pres.charts.BAR, [{ name: "Node diperiksa (rata-rata)", labels: ["BFS", "DFS", "UCS", "A*"], values: [9556, 9137, 8748, 2547] }], {
  x: 0.6, y: 1.4, w: 6.8, h: 5.3, barDir: "col", chartColors: ["8A97A8", "8A97A8", "8A97A8", ORANYE], invertedColors: [],
  showTitle: true, title: "Rata-rata node diperiksa (skenario banjir)", titleFontSize: 14, titleColor: NAVY, titleFontFace: BODY,
  showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: NAVY, dataLabelFormatCode: "#,##0", dataLabelFontFace: BODY,
  catAxisLabelColor: ABU, valAxisLabelColor: ABU, catAxisLabelFontFace: BODY, valAxisLabelFontFace: BODY, catAxisLabelFontSize: 13, valAxisLabelFontSize: 11,
  valGridLine: { color: "E3E8EE", size: 0.5 }, catGridLine: { style: "none" }, showLegend: false, valAxisLabelFormatCode: "#,##0",
});
tabel(s, [
  ["Algoritma", kanan("Node"), kanan("Biaya/optimal"), kanan("Optimal")],
  ["BFS", kanan("9.556"), kanan("1,30×"), kanan("2%")],
  ["DFS", kanan("9.137"), kanan("39,77×"), kanan("0%")],
  ["UCS", kanan("8.748"), kanan("1,00×"), kanan("100%")],
  [sorot("A*"), sorot("2.547", { align: "right" }), sorot("1,00×", { align: "right" }), sorot("100%", { align: "right" })],
], { x: 7.7, y: 1.5, w: 5.0, colW: [1.3, 1.1, 1.5, 1.1], fontSize: 14 });
kotak(s, 7.7, 4.2, 5.0, 2.5);
teks(s, "BFS hanya optimal terhadap jumlah langkah (optimal di 2% pasangan). DFS tidak pernah optimal, rata-rata 39,8× biaya optimal. UCS dan A* selalu optimal, tetapi A* memeriksa node 8.748 / 2.547 ≈ 3,4× lebih sedikit.", { x: 7.95, y: 4.4, w: 4.5, h: 2.15, fontSize: 14 });
s.addNotes("Angka utama BAB II: A* selalu optimal dan memeriksa node 3,4 kali lebih sedikit dari UCS pada 50 pasangan acak. Di web tertulis 4,1 kali karena dihitung dari 7 titik banjir; dua-duanya benar dengan sumber data berbeda.");

// =================== 5. Implementasi & penutup ===================
S = "Implementasi dan penutup";
pres.addSection({ title: S });

// 28. Demo web
s = konten("Demo web: model dijalankan langsung di browser", S);
[
  ["/klasifikasi", "Ketik satu tweet → label laporan/bukan, peluang, dan teks hasil pra-pemrosesan; tabel metrik dan confusion matrix"],
  ["/klaster", "Sebaran 1.500 tweet, 11 kartu klaster dengan 3 tweet ringkasan, tabel ROUGE, dan \"coba ringkas sendiri\""],
  ["/rute", "Pilih 7 titik banjir atau klik peta, skenario normal/banjir, A*/UCS/BFS/DFS, animasi penjelajahan, bandingkan semua"],
].forEach(([j, d], i) => {
  const x = 0.6 + i * 4.1;
  kotak(s, x, 1.5, 3.9, 2.6);
  teks(s, j, { x: x + 0.25, y: 1.7, w: 3.4, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: BIRU });
  teks(s, d, { x: x + 0.25, y: 2.3, w: 3.4, h: 1.7, fontSize: 14 });
});
kotak(s, 0.6, 4.35, 12.1, 1.1, NAVY);
teks(s, [{ text: "banjir-cileduk.vercel.app", options: { bold: true, color: PUTIH, hyperlink: { url: "https://banjir-cileduk.vercel.app" } } }],
  { x: 0.85, y: 4.45, w: 11.6, h: 0.9, fontFace: HEAD, fontSize: 30, valign: "middle" });
teks(s, [
  { text: "Cara kerja: ", options: { bold: true } },
  { text: "bobot Naive Bayes, hasil klaster, dan graf jalan diekspor dari Python ke JSON; algoritma ditulis ulang dalam TypeScript. 130 uji memastikan hasil web sama dengan Python. Stemming memakai tabel hasil Sastrawi. Supabase hanya-baca (RLS); bila tak terjangkau, web memakai data lokal.", options: {} },
], { x: 0.6, y: 5.65, w: 12.1, h: 1.2, fontSize: 14 });
s.addNotes("Saatnya demo langsung. Urutan: klasifikasi satu tweet laporan lalu satu tweet opini; klaster 10 versus klaster 3; rute Raden Saleh, skenario normal 0,23 km lalu banjir 1,73 km, putar animasi, bandingkan semua. Web tidak melatih model; hanya prediksi yang dijalankan di browser.");

// 29. Kesimpulan
s = konten("Kesimpulan: menjawab empat rumusan masalah", S);
[
  ["Naive Bayes paling optimal untuk mengenali laporan banjir: F1 CV 0,687 dan F1 uji 0,612, di atas KNN (0,565) dan Decision Tree (0,518).", BIRU],
  ["K-Means pada TF-IDF + LSA membagi 3.390 tweet menjadi 11 topik yang dapat ditafsirkan; proporsi laporan Naive Bayes membedakan klaster kejadian dari opini.", BIRU],
  ["Hybrid TF-IDF cenderung lebih baik dari TF-IDF standar, tetapi setara dengan pemilihan acak; tidak ada selisih signifikan pada 10 set.", BIRU],
  ["A* dengan heuristik haversine selalu optimal dan memeriksa node 3,4× lebih sedikit dari UCS; informasi genangan mengubah rute (0,23 → 1,73 km).", ORANYE],
].forEach(([d, w], i) => {
  const y = 1.45 + i * 1.33;
  kotak(s, 0.6, y, 12.1, 1.18);
  bulat(s, 0.85, y + 0.31, i + 1, w);
  teks(s, d, { x: 1.7, y: y + 0.12, w: 10.75, h: 0.95, fontSize: 16, valign: "middle" });
});
s.addNotes("Empat kesimpulan sesuai urutan empat rumusan masalah.");

// 30. Keterbatasan dan saran
s = konten("Keterbatasan yang kami akui dan saran pengembangan", S);
tabel(s, [
  ["Keterbatasan", "Saran"],
  ["Batas topik tweet tidak tegas (silhouette 0,07)", "Representasi kontekstual IndoBERT untuk klasifikasi dan klasterisasi"],
  ["Evaluasi ringkasan hanya 10 set dari satu klaster, 2 anotator", "Lebih banyak set lintas klaster dan anotator agar daya uji cukup"],
  ["Ringkasan ekstraktif, acuan abstraktif", "Peringkasan berbasis frasa kunci (IKDSumm; Garg dkk., 2024)"],
  ["Genangan dimodelkan lingkaran 150–300 m", "Data genangan aktual: laporan warga terverifikasi atau sensor"],
  ["Lokasi dari tweet sudah diekstrak tetapi belum jadi titik awal rute", "Menghubungkan ekstraksi lokasi langsung ke pencarian rute"],
  ["Data publik 2018–2023, bukan crawling langsung", "Pengumpulan data waktu nyata"],
], { x: 0.6, y: 1.45, w: 12.1, colW: [5.9, 6.2], fontSize: 14, rowH: 0.62 });
s.addNotes("Lebih baik kami yang menyebut keterbatasan lebih dulu. Paling penting: lokasi di tweet sudah diekstrak di notebook 1 dan disimpan, tetapi titik awal rute masih dari 7 titik BPBD atau klik peta.");

// 31. Kontribusi
s = konten("Kontribusi pada Industri 4.0/5.0 dan sistem enterprise", S);
[
  ["Otomatisasi pemantauan", "Petugas tidak perlu membaca ribuan tweet; agen menyajikan laporan situasi per topik."],
  ["Integrasi enterprise", "Hasil di PostgreSQL (Supabase) bisa dipakai modul ticketing CRM pusat panggilan darurat atau fleet management ERP (Verdugo Fernández dkk., 2026; Esparza dkk., 2024)."],
  ["Biaya rendah", "Model berjalan di browser dengan data terbuka (OpenStreetMap), tanpa server khusus."],
].forEach(([j, d], i) => {
  const y = 1.45 + i * 1.6;
  kotak(s, 0.6, y, 12.1, 1.45);
  bulat(s, 0.85, y + 0.5, i + 1, BIRU);
  teks(s, j, { x: 1.7, y: y + 0.2, w: 10.7, h: 0.45, fontSize: 18, bold: true });
  teks(s, d, { x: 1.7, y: y + 0.7, w: 10.7, h: 0.75, fontSize: 15 });
});
teks(s, "Society 5.0: data ruang siber (media sosial) diolah AI untuk menyelesaikan masalah di ruang fisik (keselamatan warga).", { x: 0.6, y: 6.35, w: 12.1, h: 0.5, fontSize: 14, italic: true, color: ABU });
s.addNotes("Bagian 1.6 laporan. Kaitkan dengan Society 5.0 dan sistem enterprise.");

// 32. Daftar pustaka utama
s = konten("Referensi utama", S);
const ref = [
  "Ariyanto, A. D. P., dkk. (2025). Annotated data for semantic role labeling of crisis events in Indonesian Tweets. Data in Brief, 61, 111688.",
  "Sharifi, B., Hutton, M.-A., & Kalita, J. (2010). Experiments in microblog summarization. IEEE SocialCom, 49–56.",
  "Russell, S., & Norvig, P. (2021). Artificial intelligence: A modern approach (4th ed.). Pearson.",
  "Boeing, G. (2017). OSMnx: New methods for acquiring, constructing, analyzing, and visualizing complex street networks. CEUS, 65, 126–139.",
  "Garg, P. K., dkk. (2024). IKDSumm: Incorporating key-phrases into BERT for extractive disaster tweet summarization. Computer Speech & Language, 87.",
  "Blomeier, E., Schmidt, S., & Resch, B. (2024). Machine-learning-based relevance classification of flood-related tweets. Information, 15(3), 149.",
  "Verdugo Fernández, E. M., dkk. (2026). Graph-based safe-routing for flood-aware evacuation in urban environments. ISPRS Annals, XII-4/W2-2026.",
  "Hanafi, S., dkk. (2025). Mapping evacuation routes during a tsunami using the A* algorithm. J. Applied Mathematics and Modelling, 1(2).",
  "Airlangga, G. (2024). Comparative analysis of machine learning models for real-time disaster tweet classification. Brilliance, 4(1), 25–31.",
  "Saraswati, N. W. S., dkk. (2025). Evaluation analysis of the necessity of stemming and lemmatization in text classification. MATRIK, 24(2).",
];
teks(s, ref.map((r, i) => ({ text: r, options: { breakLine: i < ref.length - 1, indentLevel: 0 } })),
  { x: 0.6, y: 1.45, w: 12.1, h: 5.35, fontSize: 15, paraSpaceAfter: 9, color: NAVY });
s.addNotes("Sepuluh referensi utama dari 22 di daftar pustaka laporan. Dataset Ariyanto 2025, metode Hybrid TF-IDF Sharifi 2010, dan buku Russell Norvig adalah fondasi utama.");

// 33. Penutup
s = pres.addSlide({ masterName: "GELAP", sectionTitle: S });
teks(s, "TERIMA KASIH", { x: 0.8, y: 0.9, w: 11.7, h: 0.4, fontSize: 14, bold: true, color: ORANYE_MUDA, charSpacing: 2 });
s.addText("Tanya jawab", { placeholder: "title", y: 1.8, h: 1.4, fontSize: 60 });
teks(s, [
  { text: "Demo web   ", options: { color: "C9D4E3" } },
  { text: "banjir-cileduk.vercel.app", options: { bold: true, color: PUTIH, hyperlink: { url: "https://banjir-cileduk.vercel.app" }, breakLine: true } },
  { text: "Kode & data   ", options: { color: "C9D4E3" } },
  { text: "github.com/izviopm/uts-ai-banjir-ciledug", options: { bold: true, color: PUTIH, hyperlink: { url: "https://github.com/izviopm/uts-ai-banjir-ciledug" } } },
], { x: 0.8, y: 3.9, w: 11.7, h: 1.2, fontSize: 22, paraSpaceAfter: 8 });
teks(s, "Izvio Prijaya Mumin · Fatah Idzhar Hamdi · Magister Ilmu Komputer, Universitas Budi Luhur", { x: 0.8, y: 6.3, w: 11.7, h: 0.4, fontSize: 14, color: "C9D4E3" });
s.addNotes("Pertanyaan yang mungkin muncul: kenapa F1 bukan akurasi; kenapa heuristik admissible; kenapa k sebelas; kenapa Hybrid setara acak; apakah ada mesin penerjemah (tidak ada, hanya teks bahasa Indonesia yang dipakai); apakah lokasi tweet dipakai untuk rute (belum).");

pres.writeFile({ fileName: OUT }).then((f) => console.log("ditulis:", f));
