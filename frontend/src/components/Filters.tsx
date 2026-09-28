import type { Filters as F, Rider } from "../types";

const riders: { value: Rider; label: string }[] = [
  { value: "all", label: "All riders" },
  { value: "member", label: "Members" },
  { value: "casual", label: "Casual" },
];

type Props = {
  value: F;
  bounds: { start: string; end: string };
  onChange: (next: F) => void;
};

export function Filters({ value, bounds, onChange }: Props) {
  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()}>
      <label>
        From
        <input
          type="date"
          value={value.start}
          min={bounds.start}
          max={value.end}
          onChange={(e) => e.target.value && onChange({ ...value, start: e.target.value })}
        />
      </label>
      <label>
        To
        <input
          type="date"
          value={value.end}
          min={value.start}
          max={bounds.end}
          onChange={(e) => e.target.value && onChange({ ...value, end: e.target.value })}
        />
      </label>
      <fieldset className="segmented">
        <legend className="sr-only">Rider type</legend>
        {riders.map((r) => (
          <label key={r.value} className={value.rider === r.value ? "on" : undefined}>
            <input
              type="radio"
              name="rider"
              value={r.value}
              checked={value.rider === r.value}
              onChange={() => onChange({ ...value, rider: r.value })}
            />
            {r.label}
          </label>
        ))}
      </fieldset>
    </form>
  );
}
