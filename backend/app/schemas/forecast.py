from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class EnvironmentalDataCreate(BaseModel):
    location_id: int
    date: date
    latitude: float
    longitude: float
    rainfall_mm: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    river_discharge_m3s: Optional[float] = None
    water_level_m: Optional[float] = None
    elevation_m: Optional[float] = None
    land_cover: Optional[str] = None
    soil_type: Optional[str] = None
    population_density: Optional[float] = None
    infrastructure: Optional[str] = None
    historical_floods: Optional[int] = None


class EnvironmentalDataResponse(EnvironmentalDataCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ForecastResponse(BaseModel):
    location_id: Optional[int] = None
    latitude: float
    longitude: float
    target_date: Optional[str] = None
    has_records: bool = False
    records: List[EnvironmentalDataResponse] = []
    message: str
