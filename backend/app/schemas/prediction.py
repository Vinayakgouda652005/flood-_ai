from datetime import date, datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class PredictionInundationSummary(BaseModel):
    available: bool = False
    geojson: Optional[Any] = None
    flooded_area_km2: Optional[float] = None
    max_depth_m: Optional[float] = None
    avg_depth_m: Optional[float] = None


class PredictionRequestCreate(BaseModel):
    """
    User-driven prediction request payload sent from the frontend.
    """
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude for flood projection")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude for flood projection")
    date: str = Field(..., description="Target prediction date in YYYY-MM-DD format")
    location_name: Optional[str] = Field(None, description="Optional human-readable location name")


class PredictionRecordCreate(BaseModel):
    """
    Used when a trained AI model produces a prediction or when seeding ground truth.
    """
    prediction_request_id: int
    flood_probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    risk_level: Optional[str] = None
    flood_occurred: Optional[int] = Field(None, ge=0, le=1)


class PredictionResponse(BaseModel):
    """
    Standardized response returned to the frontend.
    Adheres strictly to the user prompt requirement:
    - Do NOT generate fake flood probabilities.
    - Status clearly flags PENDING_AI_MODEL when no model/prediction is loaded.
    """
    latitude: float
    longitude: float
    date: str
    status: str = "PENDING_AI_MODEL"
    message: str
    location_name: Optional[str] = None
    flood_probability: Optional[float] = None
    risk_level: Optional[str] = "PENDING"
    flood_occurred: Optional[int] = None
    inundation: PredictionInundationSummary = Field(default_factory=PredictionInundationSummary)
    request_id: Optional[int] = None
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
