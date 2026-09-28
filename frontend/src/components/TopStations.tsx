import type { StationCount } from "../types";
import { fmt } from "../format";

export function TopStations({ rows }: { rows: StationCount[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.departures, r.arrivals)));
  return (
    <ol className="stations">
      {rows.map((r) => {
        const net = r.arrivals - r.departures;
        return (
          <li key={r.station}>
            <div className="station-head">
              <span>{r.station}</span>
              <span className="count">{fmt(r.departures)}</span>
            </div>
            <div className="bar">
              <span style={{ width: `${(r.departures / max) * 100}%` }} />
            </div>
            <p className="net">
              {net === 0 ? "Balanced" : net > 0 ? `${fmt(net)} more arrivals` : `${fmt(-net)} more departures`}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
