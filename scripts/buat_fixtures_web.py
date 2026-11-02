"""Membuat data uji (fixtures) untuk web + tabel stem, dan memvalidasi spesifikasi docs/web/ALGORITMA.md.

Semua algoritma di sini sengaja ditulis ulang HANYA dari file JSON di web/public/model/ (persis seperti yang
akan dilakukan TypeScript), lalu hasilnya dicocokkan dengan hasil notebook. Jika assert lolos, spesifikasi
dan file ekspor terbukti cukup untuk mereproduksi hasil penelitian.

Jalankan dari root repo:  .venv/Scripts/python scripts/buat_fixtures_web.py
"""
import heapq
import json
import math
import random
import re
import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, "notebooks")
import teks  # noqa: E402
from ringkas import hybrid_tfidf  # noqa: E402

MODEL = Path("web/public/model")
FIX = Path("web/fixtures")
FIX.mkdir(parents=True, exist_ok=True)
baca = lambda p: json.loads(Path(p).read_text(encoding="utf8"))
tulis = lambda p, o: Path(p).write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf8")

# ---------------------------------------------------------------- 1. tabel stem (Python Sastrawi = kebenaran)
korpus = baca("data/processed/korpus_jabodetabek.json")
berlabel = baca("data/processed/tweets_banjir.json")
pre = baca(MODEL / "preprocessing.json")
STOP, SLANG = set(pre["stopwords"]), pre["slang"]
if (MODEL / "stem_lookup.json").exists() and "--ulang-stem" not in sys.argv:  # stemming seluruh korpus ±13 menit
    stem_lookup = baca(MODEL / "stem_lookup.json")
else:
    kata = {SLANG.get(w, w) for t in [r["text_raw"] for r in korpus + berlabel] for w in teks.bersihkan(t).split()}
    stem_lookup = {w: teks.stem(w) for w in sorted(kata) if w not in STOP and len(w) > 1 and teks.stem(w) != w}
    (MODEL / "stem_lookup.json").write_text(json.dumps(stem_lookup, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
print(f"stem_lookup.json: {len(stem_lookup)} kata, {(MODEL / 'stem_lookup.json').stat().st_size // 1024} KB")


def preprocess_dari_json(teks_mentah):
    """Preprocessing memakai preprocessing.json + stem_lookup.json saja (cara web)."""
    k = [SLANG.get(w, w) for w in teks.bersihkan(teks_mentah).split()]
    k = [stem_lookup.get(w, w) for w in k if w not in STOP and len(w) > 1]
    return " ".join(w for w in k if w not in STOP)


# ---------------------------------------------------------------- 2. preprocessing + Naive Bayes
nb = baca(MODEL / "naive_bayes.json")
idx = {w: i for i, w in enumerate(nb["vocab"])}


def nb_prob(bersih):
    tok = bersih.split()
    grams = tok + [f"{a} {b}" for a, b in zip(tok, tok[1:])]
    tf = {}
    for g in grams:
        if g in idx:
            tf[idx[g]] = tf.get(idx[g], 0) + 1
    if not tf:
        return 0.0  # tidak ada kata yang dikenal model
    v = {i: (1 + math.log(c)) * nb["idf"][i] for i, c in tf.items()}
    n = math.sqrt(sum(x * x for x in v.values()))
    s = [nb["class_log_prior"][k] + sum(x / n * nb["feature_log_prob"][k][i] for i, x in v.items()) for k in (0, 1)]
    return 1 / (1 + math.exp(s[0] - s[1]))


rng = random.Random(42)
contoh = rng.sample([r["text_raw"] for r in berlabel if r["split"] == "test"], 15) + rng.sample([r["text_raw"] for r in korpus], 15)
contoh += ["Banjir 50 cm di Jl. HOS Cokroaminoto Ciledug, motor mogok!! https://t.co/x @bpbd", "Gak banjir kok, udah surut dari tadi pagi"]
fx_teks = []
for t in contoh:
    bersih = teks.preprocess(t)
    assert preprocess_dari_json(t) == bersih, (t, preprocess_dari_json(t), bersih)
    p = nb_prob(bersih)
    fx_teks.append(dict(text_raw=t, text_clean=bersih, p_laporan=round(p, 10), label="laporan" if p >= 0.5 else "bukan_laporan"))
tulis(FIX / "preprocessing_nb.json", fx_teks)
print(f"✓ preprocessing_nb.json: {len(fx_teks)} kasus; preprocessing dari JSON identik dengan Python")

# ---------------------------------------------------------------- 3. graf + searching
g = baca(MODEL / "graph_ciledug.json")
LAT = [n[0] for n in g["nodes"]]
LON = [n[1] for n in g["nodes"]]
adj = [[] for _ in g["nodes"]]
for u, v, L, f in g["edges"]:  # urutan baris file = urutan tetangga (wajib dipertahankan)
    adj[u].append((v, L, bool(f)))
GOALS = {s["node"] for s in g["safe_places"]}
PEN = g["penalti"]


def hav(a, b):
    p1, p2 = math.radians(LAT[a]), math.radians(LAT[b])
    x = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(LON[b] - LON[a]) / 2) ** 2
    return 12_742_000 * math.asin(math.sqrt(x))


def biaya(L, f, banjir):
    return L * (PEN if f and banjir else 1)


def selesai(nama, parent, goal, expanded, banjir, jejak):
    path = [goal]
    while parent[path[-1]] is not None:
        path.append(parent[path[-1]])
    path.reverse()
    jarak = cost = 0.0
    for a, b in zip(path, path[1:]):
        L, f = next((L, f) for w, L, f in adj[a] if w == b)
        jarak += L
        cost += biaya(L, f, banjir)
    return dict(algoritma=nama, expanded=expanded, path=path, jarak_m=round(jarak, 3), biaya=round(cost, 3), jejak=jejak)


def bfs(s, goals, banjir):
    q, parent, ex, jejak = deque([s]), {s: None}, 0, []
    while q:
        u = q.popleft(); ex += 1; jejak.append(u)
        if u in goals:
            return selesai("BFS", parent, u, ex, banjir, jejak)
        for v, _, _ in adj[u]:
            if v not in parent:
                parent[v] = u; q.append(v)


def dfs(s, goals, banjir):
    st, parent, vis, ex, jejak = [s], {s: None}, set(), 0, []
    while st:
        u = st.pop()
        if u in vis:
            continue
        vis.add(u); ex += 1; jejak.append(u)
        if u in goals:
            return selesai("DFS", parent, u, ex, banjir, jejak)
        for v, _, _ in reversed(adj[u]):
            if v not in vis:
                parent[v] = u; st.append(v)


def best_first(s, goals, banjir, astar):
    gl = list(goals)
    h = (lambda n: min(hav(n, x) for x in gl)) if astar else (lambda n: 0.0)
    gsc, parent, closed, ex, jejak = {s: 0.0}, {s: None}, set(), 0, []
    heap, k = [(h(s), 0, s)], 1
    while heap:
        _, _, u = heapq.heappop(heap)
        if u in closed:
            continue
        closed.add(u); ex += 1; jejak.append(u)
        if u in goals:
            return selesai("A*" if astar else "UCS", parent, u, ex, banjir, jejak)
        for v, L, f in adj[u]:
            ng = gsc[u] + biaya(L, f, banjir)
            if ng < gsc.get(v, math.inf):
                gsc[v] = ng; parent[v] = u
                heapq.heappush(heap, (ng + h(v), k, v)); k += 1


ALGO = {"BFS": bfs, "DFS": dfs, "UCS": lambda s, G, b: best_first(s, G, b, False), "A*": lambda s, G, b: best_first(s, G, b, True)}
kasus = []
for fp in g["flood_points"]:
    for sk in ("normal", "banjir"):
        for nama, fn in ALGO.items():
            r = fn(fp["node"], GOALS, sk == "banjir")
            kasus.append(dict(asal=fp["name"], start=fp["node"], skenario=sk, **{k: r[k] for k in ("algoritma", "expanded", "jarak_m", "biaya", "path")},
                              jejak_awal=r["jejak"][:50]))

# Validasi terhadap rata-rata hasil Notebook 3 (tabel "7 titik banjir × 2 skenario")
ACUAN_NB3 = {("banjir", "A*"): (1469.97, 135.57), ("banjir", "UCS"): (1469.97, 554.71), ("banjir", "BFS"): (1278.50, 621.43),
             ("banjir", "DFS"): (10408.22, 290.43), ("normal", "A*"): (1145.91, 161.00), ("normal", "UCS"): (1145.91, 691.29),
             ("normal", "BFS"): (1278.50, 621.43), ("normal", "DFS"): (10408.22, 290.43)}
for (sk, al), (jarak, ex) in ACUAN_NB3.items():
    rs = [c for c in kasus if c["skenario"] == sk and c["algoritma"] == al]
    mj, me = sum(c["jarak_m"] for c in rs) / len(rs), sum(c["expanded"] for c in rs) / len(rs)
    assert abs(mj - jarak) < 1.0 and abs(me - ex) < 0.01, (sk, al, mj, me, jarak, ex)
for c in kasus:  # UCS dan A* harus sama-sama optimal
    if c["algoritma"] == "A*":
        u = next(x for x in kasus if x["start"] == c["start"] and x["skenario"] == c["skenario"] and x["algoritma"] == "UCS")
        assert abs(u["biaya"] - c["biaya"]) < 1e-6
tulis(FIX / "searching.json", dict(catatan="start/path/jejak = indeks node di graph_ciledug.json; goals = semua safe_places[].node; "
                                             "jejak_awal = 50 node pertama yang di-expand (urutan harus identik)", kasus=kasus))
print(f"✓ searching.json: {len(kasus)} kasus; rata-rata jarak & expanded cocok dengan Notebook 3; A* = UCS (optimal)")

# ---------------------------------------------------------------- 4. Hybrid TF-IDF
sets = baca("data/reference/set_evaluasi.json")
fx_ring = []
for s in sets:
    bersih = [teks.preprocess(t) for t in s["tweets"]]
    assert bersih == [preprocess_dari_json(t) for t in s["tweets"]]
    pilih, skor = hybrid_tfidf(bersih)
    fx_ring.append(dict(set_id=s["set_id"], text_clean=bersih, terpilih=pilih, skor=[round(float(x), 12) for x in skor]))
tulis(FIX / "hybrid_tfidf.json", fx_ring)
print(f"✓ hybrid_tfidf.json: {len(fx_ring)} set × 25 tweet")
