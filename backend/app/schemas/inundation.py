from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class InundationCreate(BaseModel):
    prediction_request_id: Optional[int] = None
    horizon_hours: int = 24
    flooded_area_km2: Optional[float] = None
    max_depth_m: Optional[float] = None
    avg_depth_m: Optional[float] = None
    geojson_data: Optional[str] = None
    status: str = "PENDING_AI_MODEL"


class InundationResponse(BaseModel):
    available: bool = False
    prediction_request_id: Optional[int] = None
    horizon_hours: int = 24
    flooded_area_km2: Optional[float] = None
    max_depth_m: Optional[float] = None
    avg_depth_m: Optional[float] = None
    geojson: Optional[Any] = None
    message: str

    model_config = ConfigDict(from_attributes=True)
