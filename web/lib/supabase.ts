import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MetrikModel, SearchRun } from "./tipe";

// Skema kustom membuat tipe generik Supabase berbeda dari default "public".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Klien = SupabaseClient<any, any, any>;

let klien: Klien | null | undefined;

/** Null bila env belum diisi — halaman harus tetap jalan dengan data lokal. */
export function getSupabase(): Klien | null {
  if (klien !== undefined) return klien;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    klien = null;
    return null;
  }
  try {
    klien = createClient(url, key, { db: { schema: "uts_ai_bencana" } });
  } catch {
    klien = null;
  }
  return klien;
}

const TIMEOUT_MS = 2000;

async function denganTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
  try {
    return await fn(AbortSignal.timeout(TIMEOUT_MS));
  } catch {
    return null;
  }
}

export async function ambilMetrik(): Promise<MetrikModel[] | null> {
  const s = getSupabase();
  if (!s) return null;
  return denganTimeout(async (signal) => {
    const { data, error } = await s
      .from("model_metrics")
      .select(
        "model, accuracy, precision_score, recall, f1, cv_f1_mean, cv_f1_std, confusion_matrix, best_params, train_time_ms",
      )
      .abortSignal(signal);
    if (error || !data?.length) return null;
    return data as unknown as MetrikModel[];
  });
}

export async function ambilSearchRuns(): Promise<SearchRun[] | null> {
  const s = getSupabase();
  if (!s) return null;
  return denganTimeout(async (signal) => {
    const { data, error } = await s
      .from("search_runs")
      .select("scenario, algorithm, nodes_expanded, path_length_m, runtime_ms")
      .abortSignal(signal);
    if (error || !data?.length) return null;
    return data as unknown as SearchRun[];
  });
}
