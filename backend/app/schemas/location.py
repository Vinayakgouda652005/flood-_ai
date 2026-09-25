from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Human readable location or river basin name")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude coordinate in degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude coordinate in degrees")


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
