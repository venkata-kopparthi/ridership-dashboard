import sqlite3
from datetime import date, timedelta

from .schemas import RiderFilter


def _where(start: date, end: date, rider: RiderFilter) -> tuple[str, list]:
    clauses = ["started_at >= ?", "started_at < ?"]
    params: list = [start.isoformat(), (end + timedelta(days=1)).isoformat()]
    if rider != "all":
        clauses.append("rider_type = ?")
        params.append(rider)
    return " AND ".join(clauses), params


def summary(conn: sqlite3.Connection, start: date, end: date, rider: RiderFilter) -> dict:
    where, params = _where(start, end, rider)
    row = conn.execute(
        f"""
        SELECT COUNT(*) AS trips,
               COALESCE(AVG(duration_min), 0) AS avg_duration,
               COALESCE(AVG(rider_type = 'member'), 0) AS member_share
        FROM trips WHERE {where}
        """,
        params,
    ).fetchone()
    busiest = conn.execute(
        f"""
        SELECT start_station FROM trips WHERE {where}
        GROUP BY start_station ORDER BY COUNT(*) DESC LIMIT 1
        """,
        params,
    ).fetchone()
    return {
        "trips": row["trips"],
        "avg_duration_min": round(row["avg_duration"], 1),
        "member_share": round(row["member_share"], 3),
        "busiest_station": busiest["start_station"] if busiest else None,
    }


def daily(conn: sqlite3.Connection, start: date, end: date, rider: RiderFilter) -> list[dict]:
    where, params = _where(start, end, rider)
    rows = conn.execute(
        f"""
        SELECT substr(started_at, 1, 10) AS day,
               SUM(rider_type = 'member') AS member,
               SUM(rider_type = 'casual') AS casual
        FROM trips WHERE {where}
        GROUP BY day ORDER BY day
        """,
        params,
    ).fetchall()
    return [dict(r) for r in rows]


def heatmap(conn: sqlite3.Connection, start: date, end: date, rider: RiderFilter) -> list[dict]:
    # always return the full 7x24 grid so the UI does not have to fill gaps
    where, params = _where(start, end, rider)
    rows = conn.execute(
        f"""
        SELECT (CAST(strftime('%w', started_at) AS INTEGER) + 6) % 7 AS weekday,
               CAST(strftime('%H', started_at) AS INTEGER) AS hour,
               COUNT(*) AS trips
        FROM trips WHERE {where}
        GROUP BY weekday, hour
        """,
        params,
    ).fetchall()
    counts = {(r["weekday"], r["hour"]): r["trips"] for r in rows}
    return [
        {"weekday": wd, "hour": h, "trips": counts.get((wd, h), 0)}
        for wd in range(7)
        for h in range(24)
    ]


def top_stations(
    conn: sqlite3.Connection, start: date, end: date, rider: RiderFilter, limit: int
) -> list[dict]:
    where, params = _where(start, end, rider)
    rows = conn.execute(
        f"""
        WITH dep AS (
            SELECT start_station AS station, COUNT(*) AS n FROM trips
            WHERE {where} GROUP BY start_station
        ),
        arr AS (
            SELECT end_station AS station, COUNT(*) AS n FROM trips
            WHERE {where} GROUP BY end_station
        )
        SELECT dep.station, dep.n AS departures, COALESCE(arr.n, 0) AS arrivals
        FROM dep LEFT JOIN arr USING (station)
        ORDER BY departures DESC LIMIT ?
        """,
        [*params, *params, limit],
    ).fetchall()
    return [dict(r) for r in rows]


def date_range(conn: sqlite3.Connection) -> dict:
    row = conn.execute(
        "SELECT substr(MIN(started_at), 1, 10) AS start,"
        " substr(MAX(started_at), 1, 10) AS end FROM trips"
    ).fetchone()
    return {"start": row["start"], "end": row["end"]}
