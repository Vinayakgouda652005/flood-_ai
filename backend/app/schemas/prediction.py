from datetime import date, datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict, field_validator


class PredictionInundationSummary(BaseModel):
    available: bool = False
    geojson: Optional[Any] = None
    flooded_area_km2: Optional[float] = None
    max_depth_m: Optional[float] = None
    avg_depth_m: Optional[float] = None


class LocationNested(BaseModel):
    name: str
    latitude: float
    longitude: float

    model_config = ConfigDict(from_attributes=True)


class PredictionRequestCreate(BaseModel):
    """
    User-driven prediction request payload sent from frontend or API client.
    """
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude for flood projection")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude for flood projection")
    date: str = Field(..., description="Target prediction date in strict YYYY-MM-DD format")
    location_name: Optional[str] = Field(None, description="Optional human-readable location name")
    name: Optional[str] = Field(None, description="Alternative location name field")

    @field_validator("date")
    def validate_date_format(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Prediction date must be a non-empty string in YYYY-MM-DD format.")
        v_clean = v.strip()
        try:
            datetime.strptime(v_clean, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date format: '{v}'. Prediction date must strictly follow YYYY-MM-DD format.")
        return v_clean


class PredictionRecordCreate(BaseModel):
    """
    Used when a trained AI model produces a prediction or when recording ground truth.
    """
    prediction_request_id: int
    flood_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    risk_level: Optional[str] = None
    flood_occurred: Optional[int] = Field(None, ge=0, le=1)


class PredictionResponse(BaseModel):
    """
    Standardized response returned to the frontend.
    Adheres strictly to the user prompt requirement:
    - Returns status 'WAITING_FOR_AI_MODEL'.
    - Does NOT return fake flood probabilities.
    - Accurately reports stored prediction request id, location, and date.
    """
    status: str = "WAITING_FOR_AI_MODEL"
    prediction_request_id: int
    location: LocationNested
    date: str

    # Supplementary fields for seamless frontend compatibility
    request_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    flood_probability: Optional[float] = None
    risk_level: Optional[str] = "PENDING"
    flood_occurred: Optional[int] = None
    inundation: PredictionInundationSummary = Field(default_factory=PredictionInundationSummary)
    message: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PredictionHistoryItem(BaseModel):
    id: int
    location_id: int
    location_name: Optional[str] = None
    latitude: float
    longitude: float
    prediction_date: date
    status: str
    created_at: datetime
    flood_probability: Optional[float] = None
    risk_level: Optional[str] = None
    flood_occurred: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
