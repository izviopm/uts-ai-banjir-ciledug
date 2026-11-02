"""Kumpulkan semua angka untuk laporan dari output notebook dan file hasil → laporan/angka.json.

Laporan (scripts/buat_laporan.js) hanya membaca file ini, sehingga angka di laporan selalu sama dengan notebook.
"""
import ast
import json
import re
from pathlib import Path

baca = lambda p: json.loads(Path(p).read_text(encoding="utf8"))


def teks_output(nb_path):
    """Gabungkan semua output teks notebook (stream + text/plain) menjadi satu string."""
    keluar = []
    for c in baca(nb_path)["cells"]:
        for o in c.get("outputs", []):
            t = o.get("text") or o.get("data", {}).get("text/plain", "")
            keluar.append("".join(t) if isinstance(t, list) else t)
    return "\n".join(keluar)


def cari(pola, teks, ubah=float, grup=1):
    m = re.search(pola, teks, flags=re.M)
    assert m, f"pola tidak ditemukan: {pola}"
    return ubah(m.group(grup))


A = {}

# ---------------- Notebook 1 & 2
tw = baca("data/processed/tweets_banjir.json")
A["nb1"] = dict(total=len(tw), laporan=sum(t["label"] == "laporan" for t in tw), latih=sum(t["split"] == "train" for t in tw),
                uji=sum(t["split"] == "test" for t in tw))
o1 = teks_output("notebooks/01_eda_preprocessing.ipynb")
A["nb1"]["melayu"] = cari(r"Tweet terindikasi Melayu: (\d+)", o1, int)
A["nb1"]["awal"] = cari(r"Tweet terindikasi Melayu: \d+ dari (\d+)", o1, int)
A["nb2"] = baca("data/processed/model_metrics.json")
o2 = teks_output("notebooks/02_klasifikasi.ipynb")
A["nb2_vocab"] = cari(r"Ukuran kosakata: (\d+)", o2, int)

# ---------------- Notebook 3
o3 = teks_output("notebooks/03_searching_rute.ipynb")
A["nb3"] = dict(node=cari(r"Node \(persimpangan\): ([\d,]+)", o3, lambda s: int(s.replace(",", ""))),
                ruas_genang=cari(r"Ruas tergenang: (\d+)", o3, int), ruas=cari(r"Ruas tergenang: \d+ dari (\d+)", o3, int))
bench = {}
for al in ["BFS", "DFS", "UCS", "A\\*"]:
    m = re.search(rf"^{al}\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*$\n?(?:.*?)", o3, flags=re.M)
    nama = al.replace("\\", "")
    bench[nama] = dict(expanded=float(m.group(1)), runtime_ms=float(m.group(2)), rasio=float(m.group(3)))
# persen optimal ada di baris tabel terpisah (kolom terbungkus); ambil dari kalimat kesimpulan
bench["A*"]["optimal"] = cari(r"A\* selalu optimal \((\d+)% pasangan\)", o3)
bench["BFS"]["optimal"] = cari(r"BFS optimal pada (\d+)%", o3)
bench["DFS"]["optimal"] = cari(r"DFS optimal pada (\d+)%", o3)
bench["UCS"]["optimal"] = 100.0
A["nb3"]["benchmark"] = bench
A["nb3"]["rasio_astar_ucs"] = cari(r"([\d.]+)× lebih sedikit dari UCS", o3)
A["nb3"]["tambah_jarak"] = cari(r"menambah jarak A\* rata-rata (\d+) m", o3)
fx = baca("web/fixtures/searching.json")["kasus"]
rata = {}
for sk in ("normal", "banjir"):
    for al in ("BFS", "DFS", "UCS", "A*"):
        r = [c for c in fx if c["skenario"] == sk and c["algoritma"] == al]
        rata[f"{sk}|{al}"] = dict(jarak=sum(c["jarak_m"] for c in r) / len(r), expanded=sum(c["expanded"] for c in r) / len(r))
A["nb3"]["rata_titik_banjir"] = rata
A["nb3"]["studi"] = {f"{c['skenario']}|{c['algoritma']}": dict(jarak=c["jarak_m"], expanded=c["expanded"], langkah=len(c["path"]) - 1)
                     for c in fx if c["asal"] == "Jalan Raden Saleh Raya, Karang Mulya"}
g = baca("web/public/model/graph_ciledug.json")
A["nb3"]["banjir"] = [dict(name=f["name"], radius=f["radius_m"], sumber=f["source_url"]) for f in g["flood_points"]]
A["nb3"]["aman"] = len(g["safe_places"])

# ---------------- Notebook 4
o4 = teks_output("notebooks/04_klasterisasi_peringkasan.ipynb")
A["nb4"] = dict(
    lingkungan=cari(r"^(Python [^\n]+)", o4, str),
    mentah=cari(r"Korpus mentah: (\d+)", o4, int),
    jabodetabek=cari(r"Jabodetabek: (\d+)", o4, int),
    bersih=cari(r"tanpa Melayu/Inggris: (\d+)", o4, int),
    korpus=cari(r"unik & ≥3 kata: (\d+)", o4, int),
    laporan_nb=cari(r"Diprediksi laporan: (\d+)", o4, int),
    kosakata=cari(r"Kosakata: (\d+) kata", o4, int),
    lsa_var=cari(r"menjelaskan ([\d.]+)% variansi", o4),
    kmeans_unggul=cari(r"K-Means unggul silhouette pada (\d+)%", o4),
    k=cari(r"k terpilih \(elbow/kneedle\) = (\d+)", o4, int),
)
for al in ("Agglomerative", "K-Means"):
    m = re.search(rf"^{al}\s+{A['nb4']['k']}\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)", o4, flags=re.M)
    A["nb4"][al] = dict(silhouette=float(m.group(1)), davies_bouldin=float(m.group(2)), calinski_harabasz=float(m.group(3)))
A["nb4"]["klaster"] = baca("web/public/model/klaster_ringkasan.json")["klaster"]
rouge = {}
for nama in ["Hybrid TF-IDF", "TF-IDF standar", "Acak (rata-rata 20×)"]:
    m = re.search(rf"^{re.escape(nama)}\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)", o4, flags=re.M)
    rouge[nama] = dict(R1=float(m.group(1)), R2=float(m.group(2)), RL=float(m.group(3)))
A["nb4"]["rouge"] = rouge
A["nb4"]["sepakat"] = cari(r"Kesepakatan antar-anotator \(ROUGE acuan Izvio vs Fatah\): (\{.*\})", o4, ast.literal_eval)
uji = []
for m in re.finditer(r"^\d+\s+(Acak \(rata-rata 20×\)|TF-IDF standar)\s+(R1|R2|RL)\s+(\d+/10 set)\s+([-\d.]+)\s+([\d.]+)", o4, flags=re.M):
    uji.append(dict(pembanding=m.group(1), metrik=m.group(2), unggul=m.group(3), selisih=float(m.group(4)), p=float(m.group(5))))
assert len(uji) == 6, uji
A["nb4"]["wilcoxon"] = uji

Path("laporan/angka.json").write_text(json.dumps(A, ensure_ascii=False, indent=1), encoding="utf8")
print("laporan/angka.json ditulis:", {k: (list(v)[:6] if isinstance(v, dict) else v) for k, v in A.items()})
