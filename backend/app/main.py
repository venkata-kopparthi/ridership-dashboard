import os
import sqlite3
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import date
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import queries
from .schemas import DailyPoint, DateRange, HeatCell, RiderFilter, StationCount, Summary
from .seed import create_database


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.db = create_database()
    yield
    app.state.db.close()


app = FastAPI(
    title="Ridership Dashboard API",
    description="Aggregated bike-share trip data for the dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["GET"],
    allow_headers=["*"],
)


def get_db() -> sqlite3.Connection:
    return app.state.db


class Filters:
    def __init__(
        self,
        start: Annotated[date, Query(description="First day, inclusive")],
        end: Annotated[date, Query(description="Last day, inclusive")],
        rider: Annotated[RiderFilter, Query()] = "all",
    ):
        if end < start:
            raise HTTPException(status_code=422, detail="end must be on or after start")
        if (end - start).days > 366:
            raise HTTPException(status_code=422, detail="Choose a range of one year or less")
        self.start, self.end, self.rider = start, end, rider


Db = Annotated[sqlite3.Connection, Depends(get_db)]
F = Annotated[Filters, Depends()]


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/range", response_model=DateRange)
def available_range(db: Db):
    return queries.date_range(db)


@app.get("/api/summary", response_model=Summary)
def summary(db: Db, f: F):
    return queries.summary(db, f.start, f.end, f.rider)


@app.get("/api/trips/daily", response_model=list[DailyPoint])
def daily(db: Db, f: F):
    return queries.daily(db, f.start, f.end, f.rider)


@app.get("/api/trips/heatmap", response_model=list[HeatCell])
def heatmap(db: Db, f: F):
    return queries.heatmap(db, f.start, f.end, f.rider)


@app.get("/api/stations/top", response_model=list[StationCount])
def top_stations(db: Db, f: F, limit: Annotated[int, Query(ge=1, le=20)] = 8):
    return queries.top_stations(db, f.start, f.end, f.rider, limit)
