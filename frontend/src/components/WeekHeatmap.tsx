import type { HeatCell } from "../types";
import { fmt, hourLabel } from "../format";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// 0..1 -> light to dark blue
function shade(t: number) {
  const l = 95 - t * 67;
  return `hsl(214 ${45 + t * 30}% ${l}%)`;
}

export function WeekHeatmap({ cells }: { cells: HeatCell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.trips));
  const byDay = DAYS.map((_, d) => cells.filter((c) => c.weekday === d).sort((a, b) => a.hour - b.hour));

  return (
    <div className="heatmap" role="table" aria-label="Trips by weekday and hour">
      <div className="heatmap-row heatmap-hours" role="row">
        <span role="columnheader" />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} role="columnheader" className="hour">
            {h % 3 === 0 ? hourLabel(h) : ""}
          </span>
        ))}
      </div>
      {byDay.map((row, d) => (
        <div key={d} className="heatmap-row" role="row">
          <span role="rowheader" className="day">
            {DAYS[d]}
          </span>
          {row.map((c) => {
            const t = c.trips / max;
            return (
              <span
                key={c.hour}
                role="cell"
                className="cell"
                style={{ background: shade(t) }}
                title={`${DAY_NAMES[d]} ${hourLabel(c.hour)}: ${fmt(c.trips)} trips`}
                aria-label={`${DAY_NAMES[d]} ${hourLabel(c.hour)}, ${fmt(c.trips)} trips`}
                data-strong={t > 0.6 || undefined}
              />
            );
          })}
        </div>
      ))}
      <div className="legend" aria-hidden="true">
        <span>Fewer</span>
        <i style={{ background: `linear-gradient(90deg, ${shade(0)}, ${shade(0.5)}, ${shade(1)})` }} />
        <span>More trips</span>
      </div>
    </div>
  );
}
