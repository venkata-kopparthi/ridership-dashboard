import type { DailyPoint, Filters, HeatCell, StationCount, Summary } from "./types";

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const res = await fetch(`/api${path}${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  range: () => get<{ start: string; end: string }>("/range"),
  summary: (f: Filters) => get<Summary>("/summary", f),
  daily: (f: Filters) => get<DailyPoint[]>("/trips/daily", f),
  heatmap: (f: Filters) => get<HeatCell[]>("/trips/heatmap", f),
  topStations: (f: Filters) => get<StationCount[]>("/stations/top", f),
};
