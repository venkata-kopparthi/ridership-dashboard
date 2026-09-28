import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const summary = { trips: 1234, avg_duration_min: 16.2, member_share: 0.68, busiest_station: "Union Square" };

function mockApi(overrides: Record<string, unknown> = {}) {
  const responses: Record<string, unknown> = {
    "/api/range": { start: "2026-06-01", end: "2026-08-30" },
    "/api/summary": summary,
    "/api/trips/daily": [{ day: "2026-06-01", member: 200, casual: 60 }],
    "/api/trips/heatmap": Array.from({ length: 168 }, (_, i) => ({ weekday: Math.floor(i / 24), hour: i % 24, trips: 1 })),
    "/api/stations/top": [{ station: "Union Square", departures: 400, arrivals: 380 }],
    ...overrides,
  };
  return vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input).split("?")[0];
    return new Response(JSON.stringify(responses[path]), { status: 200 });
  });
}

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("loads the full date range and shows the totals", async () => {
    const fetchMock = mockApi();
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const totals = await screen.findByText("1,234");
    expect(totals).toBeInTheDocument();
    expect(screen.getByText("68%")).toBeInTheDocument();
    expect(screen.getByLabelText("From")).toHaveValue("2026-06-01");
    expect(fetchMock).toHaveBeenCalledWith("/api/summary?start=2026-06-01&end=2026-08-30&rider=all");
  });

  it("refetches with the chosen rider type", async () => {
    const fetchMock = mockApi();
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText("1,234");

    await userEvent.click(screen.getByLabelText("Members"));
    expect(fetchMock).toHaveBeenCalledWith("/api/summary?start=2026-06-01&end=2026-08-30&rider=member");
  });

  it("shows an empty state when there are no trips", async () => {
    vi.stubGlobal("fetch", mockApi({ "/api/summary": { ...summary, trips: 0, busiest_station: null } }));
    render(<App />);
    expect(await screen.findByText(/No trips in this date range/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("explains what to do when the API is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 502 })));
    render(<App />);
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(/API is running on port 8000/)).toBeInTheDocument();
  });
});
