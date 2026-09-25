from datetime import date, datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, field_validator


class EnvironmentalDataCreate(BaseModel):
    location_id: int
    date: Union[date, str]
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
    infrastructure: Optional[Union[str, float, int]] = None
    historical_floods: Optional[int] = None

    @field_validator("date")
    def validate_date_format(cls, v: Union[date, str]) -> date:
        if isinstance(v, date):
            return v
        if not v or not isinstance(v, str):
            raise ValueError("Observation date must be in YYYY-MM-DD format.")
        try:
            return datetime.strptime(v.strip(), "%Y-%m-%d").date()
        except ValueError:
            raise ValueError(f"Invalid date format: '{v}'. Date must follow YYYY-MM-DD.")

    @field_validator("infrastructure")
    def format_infrastructure(cls, v: Optional[Union[str, float, int]]) -> Optional[str]:
        if v is None:
            return None
        return str(v)


class EnvironmentalDataResponse(BaseModel):
    id: int
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
