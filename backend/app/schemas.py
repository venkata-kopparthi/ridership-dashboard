from datetime import date
from typing import Literal

from pydantic import BaseModel

RiderFilter = Literal["all", "member", "casual"]


class Summary(BaseModel):
    trips: int
    avg_duration_min: float
    member_share: float
    busiest_station: str | None


class DailyPoint(BaseModel):
    day: date
    member: int
    casual: int


class HeatCell(BaseModel):
    weekday: int  # 0 = Monday
    hour: int
    trips: int


class StationCount(BaseModel):
    station: str
    departures: int
    arrivals: int


class DateRange(BaseModel):
    start: date
    end: date
