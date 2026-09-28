"""Seeded sample data: weekday commute peaks for members, weekend afternoons for casual riders."""

import random
import sqlite3
from datetime import date, datetime, timedelta

STATIONS = [
    ("Union Square", 1.00),
    ("Grand Central", 0.95),
    ("Penn Station", 0.90),
    ("Bryant Park", 0.70),
    ("Washington Square", 0.65),
    ("Chelsea Market", 0.55),
    ("Hudson Yards", 0.50),
    ("Brooklyn Bridge Park", 0.45),
    ("Columbus Circle", 0.40),
    ("Battery Park", 0.35),
    ("Astor Place", 0.30),
    ("Tompkins Square", 0.25),
]

START_DATE = date(2026, 6, 1)
DAYS = 91


def _hour_weight(hour: int, weekend: bool, rider: str) -> float:
    if rider == "member" and not weekend:
        return 0.2 + 3.0 * _bump(hour, 8.5, 1.3) + 2.6 * _bump(hour, 17.5, 1.5)
    return 0.1 + (2.2 if weekend else 1.2) * _bump(hour, 14.5, 3.0)


def _bump(x: float, center: float, width: float) -> float:
    return 2.718 ** (-((x - center) ** 2) / (2 * width**2))


def build_trips(seed: int = 7) -> list[tuple]:
    rng = random.Random(seed)
    names = [s[0] for s in STATIONS]
    weights = [s[1] for s in STATIONS]
    trips = []

    for d in range(DAYS):
        day = START_DATE + timedelta(days=d)
        weekend = day.weekday() >= 5
        # ~1 in 8 days is a rain day
        weather = 0.45 if rng.random() < 0.12 else 1.0
        volumes = {"member": 150 if weekend else 260, "casual": 190 if weekend else 70}
        for rider, base in volumes.items():
            hour_weights = [_hour_weight(h, weekend, rider) for h in range(24)]
            for _ in range(int(base * weather * rng.uniform(0.85, 1.15))):
                hour = rng.choices(range(24), hour_weights)[0]
                started = datetime(day.year, day.month, day.day, hour, rng.randrange(60))
                start, end = rng.choices(names, weights, k=2)
                minutes = max(2, int(rng.gauss(13 if rider == "member" else 24, 6)))
                trips.append((started.isoformat(), start, end, rider, minutes))
    return trips


def create_database(path: str = ":memory:", seed: int = 7) -> sqlite3.Connection:
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE trips (
            id INTEGER PRIMARY KEY,
            started_at TEXT NOT NULL,
            start_station TEXT NOT NULL,
            end_station TEXT NOT NULL,
            rider_type TEXT NOT NULL CHECK (rider_type IN ('member', 'casual')),
            duration_min INTEGER NOT NULL
        );
        CREATE INDEX idx_trips_started ON trips(started_at);
        """
    )
    conn.executemany(
        "INSERT INTO trips (started_at, start_station, end_station, rider_type, duration_min)"
        " VALUES (?, ?, ?, ?, ?)",
        build_trips(seed),
    )
    conn.commit()
    return conn
