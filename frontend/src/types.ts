export type Rider = "all" | "member" | "casual";

export type Filters = { start: string; end: string; rider: Rider };

export type Summary = {
  trips: number;
  avg_duration_min: number;
  member_share: number;
  busiest_station: string | null;
};

export type DailyPoint = { day: string; member: number; casual: number };
export type HeatCell = { weekday: number; hour: number; trips: number };
export type StationCount = { station: string; departures: number; arrivals: number };
