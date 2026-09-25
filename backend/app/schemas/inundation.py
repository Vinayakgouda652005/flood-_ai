from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class InundationCreate(BaseModel):
    prediction_id: Optional[int] = None
    prediction_request_id: Optional[int] = None
    geojson: Optional[str] = None
    maximum_depth: Optional[float] = None
    flooded_area_km2: Optional[float] = None


class InundationResponse(BaseModel):
    available: bool = False
    geojson: Optional[Any] = None
    maximum_depth: Optional[float] = None
    flooded_area_km2: Optional[float] = None
    prediction_id: Optional[int] = None
    prediction_request_id: Optional[int] = None
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
