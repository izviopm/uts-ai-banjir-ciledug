-- Schema UTS AI: Agen Cerdas Tanggap Banjir Ciledug
-- Ditulis dari Colab (role postgres, bypass RLS); web Next.js hanya membaca (anon, RLS select-only).

create schema if not exists uts_ai_bencana;

-- Tweet berlabel (dataset Mendeley SRL Crisis Event, subset banjir)
create table uts_ai_bencana.tweets (
  id          text primary key,              -- text_id asli, mis. BAN-00001
  text_raw    text not null,
  text_clean  text,
  label       text not null check (label in ('laporan', 'bukan_laporan')),
  split       text check (split in ('train', 'test')),
  locations   text[] default '{}'            -- dari token B-LOC/PLACE-ARG/STREET-ARG
);

-- Prediksi tiap model pada data uji
create table uts_ai_bencana.predictions (
  tweet_id    text references uts_ai_bencana.tweets(id) on delete cascade,
  model       text not null,                 -- naive_bayes | knn | decision_tree
  predicted   text not null,
  probability real,
  primary key (tweet_id, model)
);

-- Metrik evaluasi per model
create table uts_ai_bencana.model_metrics (
  model            text primary key,
  accuracy         real,
  precision_score  real,
  recall           real,
  f1               real,
  cv_f1_mean       real,
  cv_f1_std        real,
  confusion_matrix jsonb,                    -- [[TN, FP], [FN, TP]]
  best_params      jsonb,
  train_time_ms    real,
  created_at       timestamptz default now()
);

-- Tempat aman / tujuan evakuasi dari OpenStreetMap
create table uts_ai_bencana.safe_places (
  id      bigint primary key,                  -- osmid
  name    text,
  kind    text,                                -- hospital | clinic | fire_station | school | place_of_worship | townhall
  lat     double precision not null,
  lon     double precision not null
);

-- Titik rawan banjir (dari berita / BPBD), dipakai menutup ruas jalan di A*
create table uts_ai_bencana.flood_points (
  id         serial primary key,
  name       text not null,
  lat        double precision not null,
  lon        double precision not null,
  radius_m   real default 150,
  source_url text
);

-- Hasil perbandingan algoritma searching
create table uts_ai_bencana.search_runs (
  id              serial primary key,
  scenario        text not null,             -- normal | banjir
  algorithm       text not null,             -- bfs | dfs | astar
  origin_node     bigint,
  goal_node       bigint,
  path_length_m   real,
  nodes_expanded  int,
  runtime_ms      real,
  path            jsonb,                     -- [[lat, lon], ...]
  created_at      timestamptz default now()
);

-- Ringkasan laporan situasi (Hybrid TF-IDF)
create table uts_ai_bencana.summaries (
  id          serial primary key,
  period      text not null,                 -- mis. 2020-01-01
  n_tweets    int,
  summary     jsonb not null,                -- kalimat terpilih + skor
  created_at  timestamptz default now()
);

-- Akses baca untuk web (anon), tulis hanya lewat koneksi database (Colab)
grant usage on schema uts_ai_bencana to anon, authenticated;
grant select on all tables in schema uts_ai_bencana to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['tweets','predictions','model_metrics','safe_places','flood_points','search_runs','summaries'] loop
    execute format('alter table uts_ai_bencana.%I enable row level security', t);
    execute format('create policy "read_all" on uts_ai_bencana.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;
