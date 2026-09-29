import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeekHeatmap } from "./WeekHeatmap";

const cells = Array.from({ length: 7 * 24 }, (_, i) => ({
  weekday: Math.floor(i / 24),
  hour: i % 24,
  trips: i === 32 ? 500 : 10, // Tuesday 8am
}));

describe("WeekHeatmap", () => {
  it("renders a cell for every weekday and hour", () => {
    render(<WeekHeatmap cells={cells} />);
    expect(screen.getAllByRole("cell")).toHaveLength(168);
    expect(screen.getAllByRole("rowheader").map((r) => r.textContent)).toEqual([
      "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
    ]);
  });

  it("labels each cell with the day, hour and count", () => {
    render(<WeekHeatmap cells={cells} />);
    const peak = screen.getByLabelText("Tuesday 8a, 500 trips");
    expect(peak).toHaveAttribute("data-strong", "true");
    expect(screen.getByLabelText("Tuesday 3a, 10 trips")).not.toHaveAttribute("data-strong");
  });

  it("scales each day on its own when perDay is set", () => {
    // Saturday (row 5) is much quieter than the Tuesday peak
    const quietSaturday = cells.map((c) => (c.weekday === 5 && c.hour === 14 ? { ...c, trips: 40 } : c));

    const { rerender } = render(<WeekHeatmap cells={quietSaturday} />);
    expect(screen.getByLabelText("Saturday 2p, 40 trips")).not.toHaveAttribute("data-strong");

    rerender(<WeekHeatmap cells={quietSaturday} perDay />);
    expect(screen.getByLabelText("Saturday 2p, 40 trips")).toHaveAttribute("data-strong", "true");
  });
});
