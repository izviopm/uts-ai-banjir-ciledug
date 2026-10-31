# %% [markdown]
# # Notebook 1 — EDA & Preprocessing Tweet Banjir
# **Proyek UTS Kecerdasan Artifisial: Agen Cerdas Tanggap Banjir Ciledug**
# Izvio Prijaya Mumin (2611600087) · Magister Komputer · Universitas Budi Luhur
#
# Tujuan notebook ini:
# 1. Memuat dataset *Semantic Role Labeling Datasets for Crisis Event* (Ariyanto dkk., 2025), subset **banjir**.
# 2. Menurunkan **label tingkat tweet** dari label tingkat token: `laporan` (kejadian banjir nyata) vs `bukan_laporan`.
# 3. Mengekstrak entitas **lokasi** yang sudah dianotasi (dipakai di Notebook 4).
# 4. Menyaring tweet berbahasa Melayu.
# 5. Preprocessing teks: case folding → cleaning → normalisasi slang → stopword removal → stemming (Sastrawi).
# 6. Membagi data latih/uji secara stratified (80:20).

# %%
import os, re, subprocess, sys
from pathlib import Path

# Colab: clone repo agar data tersedia; lokal: pindah ke root repo
if "google.colab" in sys.modules:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "Sastrawi"], check=True)
    if not Path("/content/repo").exists():
        subprocess.run(["git", "clone", "-q", "https://github.com/izviopm/uts-ai-banjir-ciledug.git", "/content/repo"], check=True)
    os.chdir("/content/repo")
elif Path("../data").exists():
    os.chdir("..")
print("Working dir:", Path.cwd())

# %%
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter

sns.set_theme(style="whitegrid")
RAW = Path("data/raw/mendeley-srl-crisis/all-labeled-data-with-english-translation.csv")
OUT = Path("data/processed"); OUT.mkdir(parents=True, exist_ok=True)
FIG = Path("laporan/gambar"); FIG.mkdir(parents=True, exist_ok=True)

tok = pd.read_csv(RAW, keep_default_na=False)
print(tok.shape)
tok.head(12)

# %% [markdown]
# ## 1. Struktur data
# Data berbentuk **satu baris per token**. Kolom `entity` berisi label NER (skema BIO: `LOC`, `PLOC`, `ORG`, `ARG`, `EVE`),
# kolom `argument` berisi label Semantic Role Labeling (mis. `FLOOD-EVENT`, `FALSE-EVENT`, `PLACE-ARG`, `STREET-ARG`).
# Prefiks `text_id` menunjukkan jenis krisis: **BAN** = banjir, GEM = gempa, KEB = kebakaran, KEC = kecelakaan.

# %%
tok["jenis"] = tok.text_id.str.split("-").str[0]
print(tok.groupby("jenis").text_id.nunique().rename("jumlah_tweet"))
ban = tok[tok.jenis == "BAN"].copy()
ban.argument.value_counts()

# %% [markdown]
# ## 2. Label tingkat tweet
# Anotator memberi label `FLOOD-EVENT` pada kata pemicu (trigger) jika tweet **melaporkan kejadian banjir yang nyata**,
# dan `FALSE-EVENT` jika kata "banjir" muncul tetapi bukan laporan kejadian (opini, politik, doa, kiasan).
#
# Aturan: tweet berlabel **`laporan`** jika memiliki minimal satu token `FLOOD-EVENT`, selain itu **`bukan_laporan`**.

# %%
def gabung_lokasi(g):
    """Gabungkan token ber-tag B-/I-LOC, B-/I-PLOC, atau argumen STREET menjadi frasa lokasi."""
    frasa, cur = [], []
    for t, e, a in zip(g.token_in_Indonesian, g.entity, g.argument):
        if e.endswith("LOC") or a == "STREET-ARG":
            if e.startswith("B-") and cur:
                frasa.append(" ".join(cur)); cur = []
            cur.append(t)
        elif cur:
            frasa.append(" ".join(cur)); cur = []
    if cur:
        frasa.append(" ".join(cur))
    return list(dict.fromkeys(frasa))  # unik, urutan tetap

tweets = (ban.groupby("text_id", sort=True)
          .apply(lambda g: pd.Series({
              "text_raw": " ".join(g.token_in_Indonesian),
              "label": "laporan" if (g.argument == "FLOOD-EVENT").any() else "bukan_laporan",
              "locations": gabung_lokasi(g),
          }), include_groups=False)
          .reset_index().rename(columns={"text_id": "id"}))
print(tweets.label.value_counts())
tweets.sample(6, random_state=1)

# %% [markdown]
# ## 3. Penyaringan tweet berbahasa Melayu
# Dataset dikumpulkan dengan kata kunci "banjir", sehingga ikut terambil tweet dari Malaysia.
# Kami memakai heuristik penanda leksikal khas Melayu/Malaysia (kata dan nama tempat). Tweet dengan **≥ 1 penanda** dibuang.

# %%
sys.path.insert(0, "notebooks")
import teks  # modul preprocessing bersama (notebooks/teks.py), dipakai juga di Notebook 4 dan web

print(sorted(teks.PENANDA_MELAYU))
skor_melayu = teks.skor_melayu

tweets["skor_melayu"] = tweets.text_raw.map(skor_melayu)
melayu = tweets[tweets.skor_melayu >= 1]
print(f"Tweet terindikasi Melayu: {len(melayu)} dari {len(tweets)}")
print(melayu.label.value_counts())
melayu.text_raw.head(8).tolist()

# %%
tweets = tweets[tweets.skor_melayu == 0].drop(columns="skor_melayu").reset_index(drop=True)
print("Setelah penyaringan:", len(tweets))
print(tweets.label.value_counts(normalize=True).round(3))

# %% [markdown]
# ## 4. Exploratory Data Analysis

# %%
tweets["n_kata"] = tweets.text_raw.str.split().str.len()
fig, ax = plt.subplots(1, 2, figsize=(12, 4))
tweets.label.value_counts().plot.bar(ax=ax[0], color=["#4C72B0", "#DD8452"])
ax[0].set_title("Distribusi kelas"); ax[0].set_xlabel(""); ax[0].tick_params(axis="x", rotation=0)
for p in ax[0].patches:
    ax[0].annotate(int(p.get_height()), (p.get_x() + p.get_width() / 2, p.get_height()), ha="center", va="bottom")
sns.histplot(data=tweets, x="n_kata", hue="label", bins=30, ax=ax[1], element="step")
ax[1].set_title("Panjang tweet (jumlah kata)")
plt.tight_layout(); plt.savefig(FIG / "01_distribusi_kelas.png", dpi=150); plt.show()
tweets.groupby("label").n_kata.describe().round(1)

# %%
tweets["punya_lokasi"] = tweets.locations.str.len() > 0
print(pd.crosstab(tweets.label, tweets.punya_lokasi, normalize="index").round(3))
top_lok = Counter(l for ls in tweets.locations for l in ls).most_common(15)
pd.DataFrame(top_lok, columns=["lokasi", "frekuensi"])

# %% [markdown]
# ## 5. Preprocessing teks
# Tahapan (mengikuti alur klasifikasi teks Twitter pada soal):
# 1. **Case folding**: semua huruf kecil.
# 2. **Cleaning**: hapus URL, mention, simbol `#`, dan tanda baca. Angka diganti token `angka`, karena laporan kejadian
#    sering memuat angka ("air 50 cm", "jam 06.45", "RT 03") sehingga keberadaan angka adalah sinyal penting.
# 3. **Normalisasi slang**: kata tidak baku → baku (kamus kecil yang relevan dengan domain).
# 4. **Stopword removal**: daftar stopword Sastrawi, dengan **pengecualian** kata yang penting untuk domain
#    (mis. "tidak", "belum", "masih", "sudah", karena "banjir *sudah* surut" ≠ "banjir *masih* tinggi").
# 5. **Stemming**: algoritma Nazief–Adriani (library Sastrawi).

# %%
import inspect
from IPython.display import Markdown, display

# Kode preprocessing ada di notebooks/teks.py agar identik dengan Notebook 4 dan web; ditampilkan di sini untuk dibaca
kode = "\n\n".join(inspect.getsource(f) for f in (teks.bersihkan, teks.preprocess))
display(Markdown(f"```python\n{kode}```"))
print("Kata yang dipertahankan dari daftar stopword:", sorted(teks.JAGA))
print("Contoh kamus slang:", dict(list(teks.SLANG.items())[:12]))

# %%
contoh = tweets.text_raw.iloc[3]
print("ASLI     :", contoh)
print("CLEANING :", teks.bersihkan(contoh))
print("FINAL    :", teks.preprocess(contoh))

tweets["text_clean"] = tweets.text_raw.map(teks.preprocess)
tweets = tweets[tweets.text_clean.str.len() > 0].reset_index(drop=True)
tweets[["text_raw", "text_clean", "label"]].head(8)

# %%
fig, ax = plt.subplots(1, 2, figsize=(13, 5))
for i, (lab, warna) in enumerate([("laporan", "#DD8452"), ("bukan_laporan", "#4C72B0")]):
    c = Counter(w for t in tweets[tweets.label == lab].text_clean for w in t.split() if w != "banjir")
    kata, frek = zip(*c.most_common(15))
    ax[i].barh(kata[::-1], frek[::-1], color=warna)
    ax[i].set_title(f"15 kata teratas — {lab}")
plt.tight_layout(); plt.savefig(FIG / "01_kata_teratas.png", dpi=150); plt.show()

# %% [markdown]
# **Pengamatan:**
# - Kelas `laporan` didominasi kata **wilayah administratif** (camat, desa, kabupaten, jalan) dan **dampak fisik**
#   (rendam, rumah, warga, korban). Laporan kejadian biasanya menyebut *di mana* dan *apa yang terdampak*.
# - Kelas `bukan_laporan` didominasi kata **bantuan/donasi** (bantu, korban, bencana) dan nama kota besar (jakarta)
#   yang muncul dalam konteks opini atau politik. Kata negasi **tidak** juga jauh lebih sering muncul di kelas ini
#   (kalimat opini/keluhan), dan ini membuktikan keputusan untuk *tidak* membuang kata negasi saat stopword removal.
# - Beberapa kata muncul di kedua kelas (korban, hujan, warga), sehingga satu kata saja tidak cukup untuk membedakan kelas.
#   Model perlu mempertimbangkan kombinasi kata, dan inilah alasan memakai pembobotan TF-IDF + bigram di Notebook 2.

# ## 6. Pembagian data latih dan uji
# Stratified split 80:20 (`random_state=42`) agar proporsi kelas sama di kedua bagian.

# %%
from sklearn.model_selection import train_test_split

idx_train, idx_test = train_test_split(tweets.index, test_size=0.2, stratify=tweets.label, random_state=42)
tweets["split"] = "train"
tweets.loc[idx_test, "split"] = "test"
print(pd.crosstab(tweets.split, tweets.label, margins=True))

kolom = ["id", "text_raw", "text_clean", "label", "split", "locations"]
tweets[kolom].to_json(OUT / "tweets_banjir.json", orient="records", force_ascii=False, indent=1)
print("Tersimpan:", OUT / "tweets_banjir.json")

# %% [markdown]
# ## Ringkasan
# - Dataset akhir berisi tweet banjir berbahasa Indonesia dengan dua kelas: `laporan` dan `bukan_laporan` (tidak seimbang).
# - Karena kelas tidak seimbang, evaluasi di Notebook 2 memakai **F1-score** sebagai metrik utama, di samping akurasi, presisi, dan recall.
# - Entitas lokasi hasil anotasi disimpan untuk ekstraksi lokasi dan pemetaan di Notebook 3–4.
