# Ridership dashboard

Dashboard for bike-share trip data: totals, trips per day, a weekday × hour heatmap and the busiest stations, filterable by date range and rider type (member or casual).

- **API:** FastAPI + SQLite, tested with pytest
- **Web:** React, TypeScript, Vite, Recharts, tested with Vitest and Testing Library

The API generates a seeded sample dataset (about 29k trips over June–August 2026) on startup, so there's nothing to download.

## Running locally

API (Python 3.11+):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Web (Node 20+), in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to the API on port 8000. Interactive API docs are at http://localhost:8000/docs.

## API

All panel endpoints take `start`, `end` (YYYY-MM-DD, inclusive) and optional `rider` (`all`, `member`, `casual`).

| Endpoint | Returns |
| --- | --- |
| `GET /api/range` | First and last day with data |
| `GET /api/summary` | Trip count, average duration, member share, busiest station |
| `GET /api/trips/daily` | Member and casual trips per day |
| `GET /api/trips/heatmap` | Trips for every weekday/hour (always 168 cells) |
| `GET /api/stations/top?limit=8` | Departures and arrivals for the busiest stations |

Ranges where `end` is before `start`, or longer than a year, return `422`.

## Tests

```bash
cd backend && pytest && ruff check .
cd frontend && npm test
```

CI runs both on every push.

## Notes / TODO

- Sample data only. Swapping in a real trip export (e.g. Citi Bike's monthly CSVs) would mean replacing `seed.py` with a loader.
- The heatmap uses a single color scale; a per-row scale would make quieter days easier to compare.
- No caching yet. Every filter change runs four queries, which is fine for SQLite at this size.
