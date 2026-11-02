"""Mesin peringkasan Hybrid TF-IDF (Sharifi, Hutton & Kalita, 2010) + seleksi anti-redundansi.

Dipakai Notebook 4 dan menjadi acuan implementasi TypeScript di web (lihat docs/web/ALGORITMA.md).
"""
import math
from collections import Counter

import numpy as np


def cosine(a, b):
    """Cosine similarity dua Counter kata."""
    num = sum(a[w] * b[w] for w in a if w in b)
    return num / (math.sqrt(sum(v * v for v in a.values())) * math.sqrt(sum(v * v for v in b.values())) or 1)


def hybrid_tfidf(kalimat_bersih, n=3, ambang=11, batas_mirip=0.77):
    """Kembalikan (indeks n tweet terpilih, skor semua tweet). `kalimat_bersih`: list teks hasil preprocess.

    TF dihitung atas seluruh kumpulan sebagai satu dokumen, IDF dengan tiap tweet sebagai dokumen,
    skor dinormalisasi panjang max(ambang, |tweet|). Tweet dengan cosine > batas_mirip terhadap yang
    sudah terpilih dilewati.
    """
    tok = [s.split() for s in kalimat_bersih]
    semua = Counter(w for t in tok for w in t)
    total = sum(semua.values())
    df_w = Counter(w for t in tok for w in set(t))
    N = len(tok)
    bobot = {w: (semua[w] / total) * math.log2(N / df_w[w]) for w in semua}
    skor = np.array([sum(bobot[w] for w in t) / max(ambang, len(t)) for t in tok])
    vec = [Counter(t) for t in tok]
    pilih = []
    for i in np.argsort(-skor, kind="stable"):  # skor tertinggi dulu; seri → indeks terkecil (deterministik, sama dgn web)
        if all(cosine(vec[i], vec[j]) <= batas_mirip for j in pilih):
            pilih.append(int(i))
        if len(pilih) == n:
            break
    return pilih, skor


if __name__ == "__main__":
    uji = ["air setinggi angka sentimeter rendam jalan ciledug indah", "air setinggi angka sentimeter rendam jalan ciledug indah",
           "banjir", "warga evakuasi posko kantor camat ciledug", "lalu lintas macet total genang jalan raden saleh"]
    p, _ = hybrid_tfidf(uji, n=3)
    assert not {0, 1} <= set(p) and 2 not in p, p  # duplikat tidak terpilih dua kali; tweet pendek tidak menang
    assert hybrid_tfidf(["a b", "a b"], n=2)[0] == [0]  # seri → indeks terkecil, duplikat dilewati
    print("ok", p)
