import pytest
from fastapi.testclient import TestClient

from app.main import app

JUNE = {"start": "2026-06-01", "end": "2026-06-30"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_range_covers_the_dataset(client):
    body = client.get("/api/range").json()
    assert body == {"start": "2026-06-01", "end": "2026-08-30"}


def test_summary_totals_add_up(client):
    everyone = client.get("/api/summary", params=JUNE).json()
    members = client.get("/api/summary", params={**JUNE, "rider": "member"}).json()
    casual = client.get("/api/summary", params={**JUNE, "rider": "casual"}).json()

    assert everyone["trips"] == members["trips"] + casual["trips"]
    assert members["member_share"] == 1.0
    assert casual["member_share"] == 0.0
    assert everyone["busiest_station"] == "Union Square"


def test_casual_riders_take_longer_trips(client):
    members = client.get("/api/summary", params={**JUNE, "rider": "member"}).json()
    casual = client.get("/api/summary", params={**JUNE, "rider": "casual"}).json()
    assert casual["avg_duration_min"] > members["avg_duration_min"]


def test_daily_returns_one_point_per_day(client):
    points = client.get("/api/trips/daily", params=JUNE).json()
    assert len(points) == 30
    assert points[0]["day"] == "2026-06-01"
    assert all(p["member"] >= 0 and p["casual"] >= 0 for p in points)


def test_heatmap_has_every_cell_and_shows_commute_peak(client):
    cells = client.get("/api/trips/heatmap", params={**JUNE, "rider": "member"}).json()
    assert len(cells) == 7 * 24
    grid = {(c["weekday"], c["hour"]): c["trips"] for c in cells}
    assert grid[(1, 8)] > 10 * max(grid[(1, 3)], 1)


def test_top_stations_respects_limit_and_order(client):
    rows = client.get("/api/stations/top", params={**JUNE, "limit": 3}).json()
    assert len(rows) == 3
    assert rows[0]["departures"] >= rows[1]["departures"] >= rows[2]["departures"]


def test_empty_range_returns_zeroes(client):
    params = {"start": "2025-01-01", "end": "2025-01-31"}
    assert client.get("/api/summary", params=params).json() == {
        "trips": 0,
        "avg_duration_min": 0,
        "member_share": 0,
        "busiest_station": None,
    }


@pytest.mark.parametrize(
    "params",
    [
        {"start": "2026-06-30", "end": "2026-06-01"},
        {"start": "2024-01-01", "end": "2026-06-01"},
        {**JUNE, "rider": "tourist"},
        {"start": "not-a-date", "end": "2026-06-01"},
    ],
)
def test_invalid_filters_are_rejected(client, params):
    assert client.get("/api/summary", params=params).status_code == 422
