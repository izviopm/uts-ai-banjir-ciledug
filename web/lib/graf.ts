import type { Algoritma, Graf, Hasil } from "./tipe";

type Rusuk = [number, number, 0 | 1];

export type GrafSiap = {
  nodes: [number, number][];
  penalti: number;
  jumlahNode: number;
  jumlahRusuk: number;
  tempatAman: Graf["safe_places"];
  titikBanjir: Graf["flood_points"];
  center: [number, number];
  segmenJalan: [[number, number], [number, number]][];
  segmenGenang: [[number, number], [number, number]][];
  cari: (start: number, algoritma: Algoritma, banjir: boolean) => Hasil;
  snap: (lat: number, lon: number) => number;
  haversine: (a: number, b: number) => number;
};

const R_BUMI_2 = 12_742_000; // 2 × 6.371 km

export function buatGraf(g: Graf): GrafSiap {
  const n = g.nodes.length;
  const adj: Rusuk[][] = new Array(n);
  for (let i = 0; i < n; i++) adj[i] = [];
  for (const [u, v, L, f] of g.edges) adj[u].push([v, L, f]); // urutan file = urutan tetangga

  const goals = new Set<number>(g.safe_places.map((s) => s.node));
  const goalList = [...goals];

  const rad = (d: number) => (d * Math.PI) / 180;

  function haversine(a: number, b: number): number {
    const [la1, lo1] = g.nodes[a];
    const [la2, lo2] = g.nodes[b];
    const p1 = rad(la1);
    const p2 = rad(la2);
    const x =
      Math.sin((p2 - p1) / 2) ** 2 +
      Math.cos(p1) * Math.cos(p2) * Math.sin(rad(lo2 - lo1) / 2) ** 2;
    return R_BUMI_2 * Math.asin(Math.sqrt(x));
  }

  // h(n) = jarak garis lurus ke tempat aman terdekat; di-cache saat dipakai
  const cacheH = new Float64Array(n).fill(Number.NaN);
  function h(node: number): number {
    const c = cacheH[node];
    if (c === c) return c; // bukan NaN
    let best = Infinity;
    for (const goal of goalList) {
      const d = haversine(node, goal);
      if (d < best) best = d;
    }
    cacheH[node] = best;
    return best;
  }

  const biayaRusuk = (L: number, f: number, banjir: boolean) =>
    L * (f === 1 && banjir ? g.penalti : 1);

  // Segmen siap-render untuk Leaflet (satu polyline multi-segmen).
  const segmenJalan: [[number, number], [number, number]][] = [];
  const segmenGenang: [[number, number], [number, number]][] = [];
  // Ruas dua arah (u→v dan v→u) cukup digambar sekali: ±separuh segmen untuk Leaflet.
  const tergambar = new Set<number>();
  for (const [u, v, , f] of g.edges) {
    const kunci = u < v ? u * n + v : v * n + u;
    if (tergambar.has(kunci)) {
      continue;
    }
    tergambar.add(kunci);
    const seg: [[number, number], [number, number]] = [g.nodes[u], g.nodes[v]];
    segmenJalan.push(seg);
    if (f === 1) segmenGenang.push(seg);
  }

  function selesai(
    nama: Algoritma,
    parent: Int32Array,
    goal: number,
    banjir: boolean,
    jejak: number[],
  ): Hasil {
    const path: number[] = [goal];
    while (parent[path[path.length - 1]] !== -2) {
      path.push(parent[path[path.length - 1]]);
    }
    path.reverse();

    let jarak = 0;
    let biaya = 0;
    for (let i = 0; i + 1 < path.length; i++) {
      const a = path[i];
      const b = path[i + 1];
      let L = 0;
      let f: 0 | 1 = 0;
      for (const r of adj[a]) {
        if (r[0] === b) {
          L = r[1];
          f = r[2];
          break;
        }
      }
      jarak += L;
      biaya += biayaRusuk(L, f, banjir);
    }
    return { algoritma: nama, path, expanded: jejak.length, jarak_m: jarak, biaya, jejak };
  }

  function bfs(start: number, banjir: boolean): Hasil {
    const parent = new Int32Array(n).fill(-1);
    parent[start] = -2;
    const queue: number[] = [start];
    let head = 0;
    const jejak: number[] = [];
    while (head < queue.length) {
      const u = queue[head++];
      jejak.push(u);
      if (goals.has(u)) return selesai("BFS", parent, u, banjir, jejak);
      for (const [v] of adj[u]) {
        if (parent[v] === -1) {
          parent[v] = u;
          queue.push(v);
        }
      }
    }
    return { algoritma: "BFS", path: [], expanded: jejak.length, jarak_m: 0, biaya: 0, jejak };
  }

  function dfs(start: number, banjir: boolean): Hasil {
    const parent = new Int32Array(n).fill(-1);
    parent[start] = -2;
    const visited = new Uint8Array(n);
    const stack: number[] = [start];
    const jejak: number[] = [];
    while (stack.length) {
      const u = stack.pop()!;
      if (visited[u]) continue;
      visited[u] = 1;
      jejak.push(u);
      if (goals.has(u)) return selesai("DFS", parent, u, banjir, jejak);
      for (let i = adj[u].length - 1; i >= 0; i--) {
        const v = adj[u][i][0];
        if (!visited[v]) {
          parent[v] = u;
          stack.push(v);
        }
      }
    }
    return { algoritma: "DFS", path: [], expanded: jejak.length, jarak_m: 0, biaya: 0, jejak };
  }

  function bestFirst(start: number, banjir: boolean, astar: boolean): Hasil {
    const nama: Algoritma = astar ? "A*" : "UCS";
    const gsc = new Float64Array(n).fill(Infinity);
    gsc[start] = 0;
    const parent = new Int32Array(n).fill(-1);
    parent[start] = -2;
    const closed = new Uint8Array(n);
    const jejak: number[] = [];

    const heap = new MinHeap();
    heap.push(astar ? h(start) : 0, 0, start);
    let counter = 1;

    while (heap.size) {
      const { node: u } = heap.pop();
      if (closed[u]) continue;
      closed[u] = 1;
      jejak.push(u);
      if (goals.has(u)) return selesai(nama, parent, u, banjir, jejak);

      for (const [v, L, f] of adj[u]) {
        const ng = gsc[u] + biayaRusuk(L, f, banjir);
        if (ng < gsc[v]) {
          gsc[v] = ng;
          parent[v] = u;
          heap.push(ng + (astar ? h(v) : 0), counter++, v);
        }
      }
    }
    return { algoritma: nama, path: [], expanded: jejak.length, jarak_m: 0, biaya: 0, jejak };
  }

  function cari(start: number, algoritma: Algoritma, banjir: boolean): Hasil {
    switch (algoritma) {
      case "BFS":
        return bfs(start, banjir);
      case "DFS":
        return dfs(start, banjir);
      case "UCS":
        return bestFirst(start, banjir, false);
      case "A*":
        return bestFirst(start, banjir, true);
    }
  }

  /**
   * Titik klik ditempelkan ke ruas jalan terdekat (bukan sekadar simpul terdekat), lalu dipilih
   * ujung ruas yang lebih dekat. Dengan begitu jalan yang benar-benar diklik yang menang atas gang
   * kecil di dekatnya.
   */
  function snap(lat: number, lon: number): number {
    const k = Math.cos(rad(lat));
    let best = 0;
    let bestD = Infinity;
    for (const [u, v] of g.edges) {
      const ax = (g.nodes[u][1] - lon) * k;
      const ay = g.nodes[u][0] - lat;
      const dx = (g.nodes[v][1] - lon) * k - ax;
      const dy = g.nodes[v][0] - lat - ay;
      const l2 = dx * dx + dy * dy;
      let t = l2 > 0 ? -(ax * dx + ay * dy) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = ax + t * dx;
      const py = ay + t * dy;
      const d = px * px + py * py;
      if (d < bestD) {
        bestD = d;
        best = t < 0.5 ? u : v;
      }
    }
    return best;
  }

  return {
    nodes: g.nodes,
    penalti: g.penalti,
    jumlahNode: n,
    jumlahRusuk: g.edges.length,
    tempatAman: g.safe_places,
    titikBanjir: g.flood_points,
    center: g.center,
    segmenJalan,
    segmenGenang,
    cari,
    snap,
    haversine,
  };
}

/** Min-heap biner dengan pembanding (f, k). */
class MinHeap {
  private f: number[] = [];
  private k: number[] = [];
  private v: number[] = [];

  get size() {
    return this.f.length;
  }

  push(f: number, k: number, v: number) {
    this.f.push(f);
    this.k.push(k);
    this.v.push(v);
    let i = this.f.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.lebihKecil(i, p)) break;
      this.tukar(i, p);
      i = p;
    }
  }

  pop(): { f: number; k: number; node: number } {
    const out = { f: this.f[0], k: this.k[0], node: this.v[0] };
    const last = this.f.length - 1;
    if (last === 0) {
      this.f.pop();
      this.k.pop();
      this.v.pop();
      return out;
    }
    this.tukar(0, last);
    this.f.pop();
    this.k.pop();
    this.v.pop();
    let i = 0;
    const n = this.f.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < n && this.lebihKecil(l, m)) m = l;
      if (r < n && this.lebihKecil(r, m)) m = r;
      if (m === i) break;
      this.tukar(i, m);
      i = m;
    }
    return out;
  }

  private lebihKecil(a: number, b: number) {
    const df = this.f[a] - this.f[b];
    if (df !== 0) return df < 0;
    return this.k[a] < this.k[b];
  }

  private tukar(a: number, b: number) {
    [this.f[a], this.f[b]] = [this.f[b], this.f[a]];
    [this.k[a], this.k[b]] = [this.k[b], this.k[a]];
    [this.v[a], this.v[b]] = [this.v[b], this.v[a]];
  }
}
