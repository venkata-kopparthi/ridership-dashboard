import type { Summary } from "../types";
import { fmt, pct } from "../format";

export function Totals({ data }: { data: Summary }) {
  return (
    <dl className="totals">
      <div>
        <dt>Trips</dt>
        <dd>{fmt(data.trips)}</dd>
      </div>
      <div>
        <dt>Average ride</dt>
        <dd>
          {data.avg_duration_min} <small>min</small>
        </dd>
      </div>
      <div>
        <dt>Taken by members</dt>
        <dd>{pct(data.member_share)}</dd>
      </div>
      <div>
        <dt>Busiest station</dt>
        <dd className="station">{data.busiest_station ?? "–"}</dd>
      </div>
    </dl>
  );
}
