from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.forecast import (
    ForecastResponse,
    EnvironmentalDataCreate,
    EnvironmentalDataResponse,
)
from app.services.forecast_service import forecast_service

router = APIRouter(prefix="/api/forecast", tags=["Forecast"])


@router.get("", response_model=ForecastResponse)
def get_environmental_forecast(
    location_id: Optional[int] = Query(None, description="Location ID to query"),
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
):
    """
    Retrieves environmental observation and forecast records from PostgreSQL.
    Strictly queries real database records; does NOT generate fake or random readings.
    """
    if date:
        try:
            datetime.strptime(date.strip(), "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: '{date}'. Date must follow YYYY-MM-DD.",
            )

    return forecast_service.get_environmental_forecast(
        db=db,
        location_id=location_id,
        latitude=latitude,
        longitude=longitude,
        target_date=date,
    )


@router.post("", response_model=EnvironmentalDataResponse, status_code=status.HTTP_201_CREATED)
def record_environmental_features(
    data: EnvironmentalDataCreate,
    db: Session = Depends(get_db),
):
    """
    Ingest verified environmental features into the database.
    This is ONLY a database storage/test endpoint.
    Does not produce AI predictions.
    """
    record = forecast_service.record_environmental_data(db=db, data=data)
    return record
