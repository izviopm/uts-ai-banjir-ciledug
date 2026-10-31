"""Preprocessing teks tweet banjir berbahasa Indonesia.

Satu sumber aturan untuk Notebook 1 (klasifikasi), Notebook 4 (klasterisasi & peringkasan),
dan web (diekspor ke JSON lewat `ekspor_json`).
"""
import json
import re

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# Penanda leksikal khas Melayu/Malaysia untuk menyaring tweet non-Indonesia
PENANDA_MELAYU = {
    "mangsa", "pemindahan", "takkan", "sahaja", "kerana", "bomba", "jkm", "apm", "nadma",
    "malaysia", "johor", "kelantan", "terengganu", "pahang", "kuantan", "mersing", "sabah", "sarawak",
    "selangor", "kedah", "melaka", "segamat", "kemaman", "dungun", "balairaya",
    "tarikh", "laluan", "kenderaan", "berehat", "pusat pemindahan",
}
_PENANDA_KATA = {p for p in PENANDA_MELAYU if " " not in p}
_PENANDA_FRASA = [p for p in PENANDA_MELAYU if " " in p]

# Kata yang dipertahankan walau ada di stopword Sastrawi: penting untuk makna kejadian banjir
JAGA = {"tidak", "belum", "masih", "sudah", "sedang", "naik", "turun", "tinggi", "dalam", "atas", "bawah"}
STOPWORDS = (set(StopWordRemoverFactory().get_stop_words()) - JAGA) | {
    "jadi", "nya", "sih", "deh", "nih", "kok", "yah", "dong", "kan", "via", "regrann"}

SLANG = {
    "gak": "tidak", "ga": "tidak", "enggak": "tidak", "engga": "tidak", "nggak": "tidak", "ngga": "tidak",
    "tdk": "tidak", "gk": "tidak", "udah": "sudah", "udh": "sudah", "sdh": "sudah", "blm": "belum",
    "msh": "masih", "lg": "lagi", "yg": "yang", "dgn": "dengan", "dg": "dengan", "utk": "untuk",
    "krn": "karena", "jg": "juga", "bgt": "banget", "aja": "saja", "sm": "sama", "dr": "dari",
    "dlm": "dalam", "tp": "tapi", "jkt": "jakarta", "tng": "tangerang", "bks": "bekasi", "dki": "jakarta",
    "jl": "jalan", "jln": "jalan", "kel": "kelurahan", "kec": "kecamatan", "cm": "sentimeter",
    "skrg": "sekarang", "bnjr": "banjir", "bjr": "banjir", "tggi": "tinggi", "smp": "sampai", "sampe": "sampai",
}

_stemmer = StemmerFactory().create_stemmer()
_cache = {}


def skor_melayu(teks):
    """Jumlah penanda Melayu dalam teks; > 0 dianggap tweet Melayu."""
    t = teks.lower()
    return len(set(t.split()) & _PENANDA_KATA) + sum(f in t for f in _PENANDA_FRASA)


def bersihkan(teks):
    """Case folding + cleaning: URL, mention, '#', tanda baca dibuang; angka jadi token 'angka'."""
    t = teks.lower()
    t = re.sub(r"https?://\S+|www\.\S+", " ", t)
    t = re.sub(r"@\w+", " ", t)
    t = t.replace("#", " ")
    t = re.sub(r"\d+([.,:]\d+)*", " angka ", t)  # tinggi air, jam, RT jadi satu token
    t = re.sub(r"[^a-z\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def stem(w):
    if w not in _cache:  # stemming Sastrawi lambat; cache per kata unik
        _cache[w] = _stemmer.stem(w)
    return _cache[w]


def preprocess(teks):
    """bersihkan → normalisasi slang → stopword → stemming → stopword lagi (menjadi → jadi)."""
    kata = [SLANG.get(w, w) for w in bersihkan(teks).split()]
    kata = [stem(w) for w in kata if w not in STOPWORDS and len(w) > 1]
    return " ".join(w for w in kata if w not in STOPWORDS)


def ekspor_json(path):
    """Simpan aturan preprocessing untuk dipakai ulang di web (TypeScript)."""
    with open(path, "w", encoding="utf8") as f:
        json.dump({"stopwords": sorted(STOPWORDS), "slang": SLANG}, f, ensure_ascii=False)


if __name__ == "__main__":
    assert bersihkan("Air 50 cm di Jl. Inpres @bpbd https://t.co/x #banjir") == "air angka cm di jl inpres banjir"
    assert preprocess("Banjir udah surut, gak tinggi lagi") == "banjir sudah surut tidak tinggi"
    assert skor_melayu("mangsa banjir di pusat pemindahan") == 3
    print("ok")
