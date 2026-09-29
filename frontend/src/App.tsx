import { useEffect, useState } from "react";
import { api } from "./api";
import { DailyTrips } from "./components/DailyTrips";
import { Filters } from "./components/Filters";
import { TopStations } from "./components/TopStations";
import { Totals } from "./components/Totals";
import { WeekHeatmap } from "./components/WeekHeatmap";
import type { DailyPoint, Filters as F, HeatCell, StationCount, Summary } from "./types";

type Data = {
  summary: Summary;
  daily: DailyPoint[];
  heatmap: HeatCell[];
  stations: StationCount[];
};

export default function App() {
  const [bounds, setBounds] = useState<{ start: string; end: string } | null>(null);
  const [filters, setFilters] = useState<F | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perDay, setPerDay] = useState(false);

  useEffect(() => {
    api
      .range()
      .then((r) => {
        setBounds(r);
        setFilters({ start: r.start, end: r.end, rider: "all" });
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!filters) return;
    let stale = false;
    setLoading(true);
    Promise.all([api.summary(filters), api.daily(filters), api.heatmap(filters), api.topStations(filters)])
      .then(([summary, daily, heatmap, stations]) => {
        if (!stale) {
          setData({ summary, daily, heatmap, stations });
          setError(null);
        }
      })
      .catch((e: Error) => !stale && setError(e.message))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [filters]);

  return (
    <div className="page">
      <header className="top">
        <div>
          <h1>Ridership</h1>
          <p className="sub">When and where people ride, by day and hour.</p>
        </div>
        {filters && bounds && <Filters value={filters} bounds={bounds} onChange={setFilters} />}
      </header>

      {error && (
        <p role="alert" className="error">
          Couldn't load trip data: {error}. Check that the API is running on port 8000.
        </p>
      )}

      {data && (
        <main className={loading ? "loading" : undefined} aria-busy={loading}>
          <Totals data={data.summary} />

          {data.summary.trips === 0 ? (
            <p className="empty">No trips in this date range. Pick dates between the first and last day of data.</p>
          ) : (
            <>
              <section className="panel week">
                <div className="panel-head">
                  <h2>The week, hour by hour</h2>
                  <label className="toggle">
                    <input type="checkbox" checked={perDay} onChange={(e) => setPerDay(e.target.checked)} />
                    Compare within each day
                  </label>
                </div>
                <WeekHeatmap cells={data.heatmap} perDay={perDay} />
              </section>

              <div className="split">
                <section className="panel">
                  <h2>Trips per day</h2>
                  <DailyTrips data={data.daily} rider={filters!.rider} />
                </section>
                <section className="panel">
                  <h2>Busiest stations</h2>
                  <TopStations rows={data.stations} />
                </section>
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}
