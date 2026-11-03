"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { GrafSiap } from "@/lib/graf";
import { NAMA_JENIS } from "@/lib/format";

/**
 * Leaflet menjadwalkan banyak pekerjaan asinkron (redraw canvas lewat requestAnimationFrame, akhir
 * transisi zoom/geser lewat setTimeout/transitionend). Bila peta dibongkar saat pekerjaan itu masih
 * antre, objek internalnya sudah hilang dan muncul galat seperti
 * "Cannot read properties of undefined (reading 'clearRect' / '_leaflet_pos')".
 * Tambalan di bawah membuat metode-metode itu diam saja ketika peta/renderer sudah dibongkar.
 */
type Proto = Record<string, unknown> & { __aman?: boolean };

function amankan(proto: Proto, nama: string[], hidup: (self: Record<string, unknown>) => boolean) {
  if (proto.__aman) return;
  for (const n of nama) {
    const asli = proto[n];
    if (typeof asli !== "function") continue;
    proto[n] = function (this: Record<string, unknown>, ...a: unknown[]) {
      if (!hidup(this)) return this;
      return (asli as (...x: unknown[]) => unknown).apply(this, a);
    };
  }
  proto.__aman = true;
}

amankan(L.Canvas.prototype as unknown as Proto, ["_clear", "_update", "_updatePaths", "_draw", "_redraw"], (m) => Boolean(m._ctx));
amankan(
  L.Map.prototype as unknown as Proto,
  ["stop", "_onZoomTransitionEnd", "_onPanTransitionStep", "_onPanTransitionEnd", "_moveEnd", "_move"],
  (m) => Boolean(m._mapPane),
);

type Props = {
  graf: GrafSiap;
  mulai: number;
  skenario: "normal" | "banjir";
  path: number[] | null;
  jejak: number[] | null;
  kunciAnimasi: number;
  jeda: boolean;
  kecepatanMs: number;
  kurangiGerak: boolean;
  onPilih: (lat: number, lon: number) => void;
  /** Titik yang diklik pengguna (null bila titik awal dipilih dari daftar). */
  klik: [number, number] | null;
};

/**
 * Leaflet menolak dipasang dua kali pada container yang sama. Saat halaman disembunyikan lalu
 * ditampilkan lagi (cacheComponents / Strict Mode) peta lama bentrok dengan yang baru, jadi
 * MapContainer hanya hidup di antara mount dan unmount efek ini, selalu dengan DOM baru.
 */
export default function PetaRute(props: Props) {
  const [siap, setSiap] = useState(false);
  const peta = useRef<L.Map | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSiap(true);
    return () => {
      // Efek induk dibersihkan lebih dulu daripada MapContainer: hentikan animasi geser/zoom
      // yang masih berjalan sebelum peta dibongkar.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- sengaja memakai nilai terbaru saat pembongkaran
      peta.current?.stop();
      setSiap(false);
    };
  }, []);
  if (!siap) return <div className="skeleton h-full min-h-[360px] w-full rounded-[1.25rem]" />;
  return <PetaInti {...props} petaRef={peta} />;
}

function PetaInti({
  petaRef,
  graf,
  mulai,
  skenario,
  path,
  jejak,
  kunciAnimasi,
  jeda,
  kecepatanMs,
  kurangiGerak,
  onPilih,
  klik,
}: Props & { petaRef: React.RefObject<L.Map | null> }) {
  return (
    <MapContainer
      ref={petaRef}
      center={graf.center}
      zoom={14}
      preferCanvas
      scrollWheelZoom
      className="peta"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
        keepBuffer={1}
      />
      <PerbaikiUkuran />
      <IkutiRute path={path} mulai={mulai} nodes={graf.nodes} kurangiGerak={kurangiGerak} klik={klik} />
      <KlikPeta onPilih={onPilih} />

      <RuasJalan graf={graf} skenario={skenario} />

      {skenario === "banjir" &&
        graf.titikBanjir.map((f) => (
          <Circle
            key={`banjir-${f.node}`}
            center={[f.lat, f.lon]}
            radius={f.radius_m}
            pathOptions={{ color: "#2563eb", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.16 }}
          >
            <Tooltip direction="top" offset={[0, -4]}>
              {f.name} · radius {f.radius_m} m
            </Tooltip>
          </Circle>
        ))}

      {graf.titikBanjir.map((f) => (
        <CircleMarker
          key={`titik-${f.node}`}
          center={[f.lat, f.lon]}
          radius={6}
          pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <strong>{f.name}</strong>
            <br />
            radius {f.radius_m} m
            <br />
            <a href={f.source_url} target="_blank" rel="noreferrer" className="link">
              Sumber berita
            </a>
          </Popup>
        </CircleMarker>
      ))}

      {graf.tempatAman.map((s, i) => (
        <CircleMarker
          key={`aman-${s.node}-${i}`}
          center={[s.lat, s.lon]}
          radius={4}
          pathOptions={{ color: "#15803d", fillColor: "#22c55e", fillOpacity: 0.85, weight: 1 }}
        >
          <Popup>
            <strong>{s.name}</strong>
            <br />
            {NAMA_JENIS[s.kind] ?? s.kind}
          </Popup>
        </CircleMarker>
      ))}

      <PenandaAwal posisi={klik ?? graf.nodes[mulai]} />
      {klik && <SambunganKlik klik={klik} simpul={graf.nodes[mulai]} />}

      <RuteAnimasi
        path={path}
        nodes={graf.nodes}
        kunci={kunciAnimasi}
        tunda={650 + (jejak && jejak.length ? Math.ceil(jejak.length / Math.max(1, Math.ceil(jejak.length / 70))) * kecepatanMs : 0)}
        durasi={Math.min(5000, Math.max(1200, kecepatanMs * 55))}
        kurangiGerak={kurangiGerak}
      />

      {path && path.length > 1 && (() => {
        const akhir = graf.tempatAman.find((s) => s.node === path[path.length - 1]);
        return akhir ? (
          <CircleMarker
            center={[akhir.lat, akhir.lon]}
            radius={9}
            pathOptions={{ color: "#14532d", fillColor: "#22c55e", fillOpacity: 1, weight: 3 }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              Tujuan: {akhir.name}
            </Tooltip>
          </CircleMarker>
        ) : null;
      })()}

      <LayerJejak
        jejak={jejak}
        kunci={kunciAnimasi}
        nodes={graf.nodes}
        jeda={jeda}
        kecepatanMs={kecepatanMs}
        kurangiGerak={kurangiGerak}
      />
    </MapContainer>
  );
}

/** Menggambar rute sedikit demi sedikit dari titik awal ke tujuan, dengan penanda yang bergerak di ujungnya. */
function RuteAnimasi({
  path,
  nodes,
  kunci,
  tunda,
  durasi,
  kurangiGerak,
}: {
  path: number[] | null;
  nodes: [number, number][];
  kunci: number;
  tunda: number;
  durasi: number;
  kurangiGerak: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!path || path.length < 2) return;
    const titik = path.map((n) => nodes[n]);
    const garis = L.polyline(kurangiGerak ? titik : [titik[0]], {
      color: "#dc2626",
      weight: 5,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);
    const kepala = L.circleMarker(kurangiGerak ? titik[titik.length - 1] : titik[0], {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#dc2626",
      fillOpacity: 1,
    }).addTo(map);
    if (kurangiGerak) {
      return () => {
        garis.remove();
        kepala.remove();
      };
    }

    // Panjang kumulatif (dalam derajat, cukup untuk kecepatan yang tampak seragam).
    const kos = Math.cos((titik[0][0] * Math.PI) / 180);
    const kum = [0];
    for (let i = 1; i < titik.length; i++) {
      kum.push(
        kum[i - 1] + Math.hypot(titik[i][0] - titik[i - 1][0], (titik[i][1] - titik[i - 1][1]) * kos),
      );
    }
    const total = kum[kum.length - 1] || 1;
    const mulai = performance.now() + tunda;
    let raf = 0;
    let idx = 0;

    const langkah = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - mulai) / durasi));
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const jarak = e * total;
      while (idx < kum.length - 2 && kum[idx + 1] < jarak) idx++;
      const seg = kum[idx + 1] - kum[idx] || 1;
      const f = Math.min(1, Math.max(0, (jarak - kum[idx]) / seg));
      const a = titik[idx];
      const b = titik[idx + 1];
      const ujung: [number, number] = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      garis.setLatLngs([...titik.slice(0, idx + 1), ujung]);
      kepala.setLatLng(ujung);
      if (p < 1) raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);

    return () => {
      cancelAnimationFrame(raf);
      garis.remove();
      kepala.remove();
    };
  }, [path, nodes, kunci, tunda, durasi, kurangiGerak, map]);

  return null;
}

/** Layer animasi node yang di-expand — imperatif agar 2.000 marker tetap ringan. */
function LayerJejak({
  jejak,
  kunci,
  nodes,
  jeda,
  kecepatanMs,
  kurangiGerak,
}: {
  jejak: number[] | null;
  kunci: number;
  nodes: [number, number][];
  jeda: boolean;
  kecepatanMs: number;
  kurangiGerak: boolean;
}) {
  const map = useMap();
  const grup = useRef<L.LayerGroup | null>(null);
  const indeks = useRef(0);

  // Layer baru setiap kali pencarian diputar ulang; bersihkan saat jejak dihapus.
  useEffect(() => {
    grup.current?.remove();
    grup.current = null;
    indeks.current = 0;
    if (!jejak || jejak.length === 0) return;
    grup.current = L.layerGroup().addTo(map);
    return () => {
      grup.current?.remove();
      grup.current = null;
    };
  }, [jejak, kunci, map]);

  useEffect(() => {
    if (!jejak || jejak.length === 0) return;
    if (kurangiGerak) {
      for (let j = 0; j < jejak.length; j++) {
        L.circleMarker(nodes[jejak[j]], {
          radius: 3,
          color: "#f97316",
          fillColor: "#f97316",
          fillOpacity: 0.85,
          weight: 0,
        }).addTo(grup.current!);
      }
      indeks.current = jejak.length;
      return;
    }
    if (jeda) return;
    const total = jejak.length;
    const perTik = Math.max(1, Math.ceil(total / 70));
    const id = window.setInterval(() => {
      if (indeks.current >= total) {
        window.clearInterval(id);
        return;
      }
      const akhir = Math.min(indeks.current + perTik, total);
      for (let j = indeks.current; j < akhir; j++) {
        L.circleMarker(nodes[jejak[j]], {
          radius: 3,
          color: "#f97316",
          fillColor: "#f97316",
          fillOpacity: 0.85,
          weight: 0,
        }).addTo(grup.current!);
      }
      indeks.current = akhir;
    }, kecepatanMs);
    return () => window.clearInterval(id);
  }, [jejak, kunci, jeda, kecepatanMs, nodes, kurangiGerak]);

  return null;
}

function RuasJalan({ graf, skenario }: { graf: GrafSiap; skenario: "normal" | "banjir" }) {
  return (
    <>
      <Polyline
        positions={graf.segmenJalan}
        smoothFactor={1.5}
        interactive={false}
        pathOptions={{ color: "#334155", weight: 1.2, opacity: 0.55 }}
      />
      {skenario === "banjir" && (
        <Polyline
          positions={graf.segmenGenang}
          pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.8 }}
        />
      )}
    </>
  );
}

/** Menggeser pandangan peta dengan halus ke rute (atau ke titik awal yang baru dipilih). */
function IkutiRute({
  path,
  mulai,
  nodes,
  kurangiGerak,
  klik,
}: {
  path: number[] | null;
  mulai: number;
  nodes: [number, number][];
  kurangiGerak: boolean;
  klik: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (path && path.length > 1) {
      map.fitBounds(L.latLngBounds(path.map((n) => nodes[n])), {
        padding: [36, 36],
        maxZoom: 16,
        animate: !kurangiGerak,
        duration: 0.9,
      });
    } else if (nodes[mulai]) {
      // Hanya menggeser (tanpa zoom keluar-masuk) agar lapisan canvas tidak berkedip.
      const t = klik ?? nodes[mulai];
      if (map.getZoom() < 15 || kurangiGerak) map.setView(t, Math.max(map.getZoom(), 15), { animate: false });
      else map.panTo(t, { animate: true, duration: 0.8, easeLinearity: 0.3 });
    }
    return () => {
      map.stop();
    };
  }, [path, mulai, map, nodes, kurangiGerak, klik]);

  return null;
}

/**
 * Penanda titik awal berupa elemen DOM (bukan canvas), supaya ikut bergeser dan berzoom bersama
 * peta tanpa berkedip. Posisinya hanya berubah saat titik awal benar-benar diganti.
 */
function PenandaAwal({ posisi }: { posisi: [number, number] }) {
  const map = useMap();
  const penanda = useRef<L.Marker | null>(null);

  useEffect(() => {
    const m = L.marker(posisi, {
      icon: L.divIcon({ className: "marker-awal", html: "<span></span>", iconSize: [24, 24], iconAnchor: [12, 12] }),
      zIndexOffset: 1000,
      keyboard: false,
    })
      .bindPopup("Titik awal")
      .addTo(map);
    penanda.current = m;
    return () => {
      m.remove();
      penanda.current = null;
    };
    // dibuat sekali per peta; perpindahan ditangani efek berikutnya
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    penanda.current?.setLatLng(posisi);
  }, [posisi]);

  return null;
}

/** Garis putus-putus dari titik yang diklik ke persimpangan yang dipakai agen sebagai titik awal. */
function SambunganKlik({ klik, simpul }: { klik: [number, number]; simpul: [number, number] }) {
  const jarak = Math.round(
    Math.hypot(
      (klik[0] - simpul[0]) * 111_320,
      (klik[1] - simpul[1]) * 111_320 * Math.cos((klik[0] * Math.PI) / 180),
    ),
  );
  if (jarak < 4) return null;
  return (
    <>
      <Polyline
        positions={[klik, simpul]}
        interactive={false}
        pathOptions={{ color: "#7f1d1d", weight: 2, dashArray: "5 6", opacity: 0.9 }}
      />
      <CircleMarker
        center={simpul}
        radius={5}
        pathOptions={{ color: "#7f1d1d", fillColor: "#ffffff", fillOpacity: 1, weight: 2 }}
      >
        <Tooltip direction="bottom" offset={[0, 6]}>
          Rute dimulai dari persimpangan ini, ±{jarak} m dari titik yang diklik
        </Tooltip>
      </CircleMarker>
    </>
  );
}

function KlikPeta({ onPilih }: { onPilih: (lat: number, lon: number) => void }) {
  const map = useMap();
  useMapEvents({
    click(e) {
      onPilih(e.latlng.lat, e.latlng.lng);
      // Riak singkat di titik yang diklik sebagai umpan balik.
      const riak = L.marker(e.latlng, {
        icon: L.divIcon({ className: "denyut", html: "<span></span>", iconSize: [44, 44] }),
        interactive: false,
        keyboard: false,
      }).addTo(map);
      window.setTimeout(() => riak.remove(), 950);
    },
  });
  return null;
}

function PerbaikiUkuran() {
  const map = useMap();
  useEffect(() => {
    const perbaiki = () => map.invalidateSize();
    const id = window.setTimeout(perbaiki, 250);
    const ro = new ResizeObserver(perbaiki);
    const el = map.getContainer();
    ro.observe(el);
    return () => {
      window.clearTimeout(id);
      ro.disconnect();
    };
  }, [map]);
  return null;
}
