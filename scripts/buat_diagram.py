"""Gambar flowchart agen dan diagram arsitektur sistem untuk laporan (laporan/gambar/00_*.png)."""
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

FIG = Path("laporan/gambar")
WARNA = {"io": "#E8F1FB", "proses": "#FFFFFF", "keputusan": "#FFF4E0", "data": "#EAF6EC", "web": "#F3ECFA"}


def kotak(ax, x, y, w, h, teks, jenis="proses", fs=9):
    if jenis == "keputusan":
        ax.add_patch(plt.Polygon([(x, y + h / 2), (x + w / 2, y + h), (x + w, y + h / 2), (x + w / 2, y)],
                                 fc=WARNA[jenis], ec="#333", lw=1.2))
    else:
        gaya = "round,pad=0.02,rounding_size=0.15" if jenis == "io" else "square,pad=0.02"
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=gaya, fc=WARNA[jenis], ec="#333", lw=1.2))
    ax.text(x + w / 2, y + h / 2, teks, ha="center", va="center", fontsize=fs, wrap=True)


def panah(ax, x1, y1, x2, y2, label=None):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="-|>", color="#333", lw=1.2))
    if label:
        ax.text((x1 + x2) / 2 + 0.08, (y1 + y2) / 2, label, fontsize=8, color="#444")


# ---------------------------------------------------------------- Flowchart agen
fig, ax = plt.subplots(figsize=(8.5, 12))
ax.set_xlim(0, 10); ax.set_ylim(0, 15); ax.axis("off")
W, H, X = 5, 0.8, 2.5
langkah = [
    (14.0, "Mulai: kumpulan tweet banjir masuk (sensor)", "io"),
    (12.8, "Preprocessing: case folding, cleaning, token 'angka',\nnormalisasi slang, stopword, stemming Sastrawi", "proses"),
    (11.6, "Klasifikasi Naive Bayes (TF-IDF unigram+bigram):\nP(laporan | tweet)", "proses"),
    (10.4, "Representasi TF-IDF + LSA 100 dimensi", "proses"),
    (9.2, "Klasterisasi K-Means (k dipilih metode elbow)", "proses"),
]
for y, t, j in langkah:
    kotak(ax, X, y, W, H, t, j)
for (y1, *_), (y2, *_) in zip(langkah, langkah[1:]):
    panah(ax, 5, y1, 5, y2 + H)
# keputusan
kotak(ax, 3, 7.4, 4, 1.3, "Klaster punya ≥ 10\ntweet laporan?", "keputusan")
panah(ax, 5, 9.2, 5, 8.7)
kotak(ax, 0.2, 5.8, 3.6, H, "Ringkas tweet laporan saja\n(Hybrid TF-IDF, 3 tweet)", "proses")
kotak(ax, 6.2, 5.8, 3.6, H, "Ringkas semua tweet klaster\n(Hybrid TF-IDF, 3 tweet)", "proses")
panah(ax, 3, 8.05, 2, 6.6, "ya"); panah(ax, 7, 8.05, 8, 6.6, "tidak")
kotak(ax, X, 4.4, W, H, "Laporan situasi per klaster (aktuator: dashboard)", "io")
panah(ax, 2, 5.8, 4, 5.2); panah(ax, 8, 5.8, 6, 5.2)
kotak(ax, X, 3.2, W, H, "Lokasi laporan → node graf jalan OSM terdekat", "proses")
panah(ax, 5, 4.4, 5, 4.0)
kotak(ax, X, 2.0, W, H, "A* ke tempat aman terdekat\n(biaya ruas tergenang × 20, heuristik haversine)", "proses")
panah(ax, 5, 3.2, 5, 2.8)
kotak(ax, X, 0.6, W, H, "Selesai: rute evakuasi ditampilkan di peta", "io")
panah(ax, 5, 2.0, 5, 1.4)
ax.set_title("Diagram alir agen cerdas peringkas laporan banjir", fontsize=12, pad=4)
plt.savefig(FIG / "00_flowchart.png", dpi=200, bbox_inches="tight"); plt.close()

# ---------------------------------------------------------------- Arsitektur sistem
fig, ax = plt.subplots(figsize=(12, 6.2))
ax.set_xlim(0, 16); ax.set_ylim(-0.6, 8.4); ax.axis("off")
kolom = [
    (0.3, "Sumber data", "data", ["Tweet banjir 2018–2023\n(Mendeley, Ariyanto dkk. 2025)", "OpenStreetMap\n(jalan & tempat aman)", "Berita BPBD\n(titik genangan)"]),
    (4.3, "Notebook Python (Colab / lokal)", "proses", ["NB1 EDA & preprocessing", "NB2 NB / KNN / Decision Tree", "NB3 BFS / DFS / UCS / A*", "NB4 Klasterisasi &\nHybrid TF-IDF"]),
    (8.3, "Penyimpanan", "data", ["Supabase PostgreSQL\nschema uts_ai_bencana (RLS)", "File JSON model\n(web/public/model)", "GitHub\n(kode, data, laporan)"]),
    (12.3, "Web (Next.js, Vercel)", "web", ["Dashboard klaster & ringkasan", "Klasifikasi langsung di browser", "Peta rute + animasi searching"]),
]
for x, judul, jenis, isi in kolom:
    ax.text(x + 1.7, 8.0, judul, ha="center", fontsize=11, weight="bold")
    tinggi = 7.2 / len(isi)
    for i, t in enumerate(isi):
        kotak(ax, x, 7.4 - (i + 1) * tinggi + 0.15, 3.4, tinggi - 0.3, t, jenis, fs=9)
for x in (3.7, 7.7, 11.7):
    panah(ax, x, 4.0, x + 0.6, 4.0)
ax.text(8.0, -0.4, "Penulisan ke Supabase hanya dari notebook (password di Colab Secrets); web membaca dengan publishable key (SELECT saja).",
        ha="center", fontsize=8.5, color="#444")
ax.set_title("Arsitektur sistem", fontsize=12)
plt.savefig(FIG / "00_arsitektur.png", dpi=200, bbox_inches="tight"); plt.close()
print("ok")
