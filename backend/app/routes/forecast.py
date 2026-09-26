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


@router.get("", response_model=List[EnvironmentalDataResponse])
def get_environmental_records(
    location_id: Optional[int] = Query(None, description="Location ID to query"),
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Retrieves environmental observation and forecast records from PostgreSQL.
    Strictly queries real database records; does NOT generate fake or random readings.
    """
    query = db.query(EnvironmentalData)

    if location_id is not None:
        query = query.filter(EnvironmentalData.location_id == location_id)
    elif latitude is not None and longitude is not None:
        tolerance = 0.02
        query = query.filter(
            EnvironmentalData.latitude.between(latitude - tolerance, latitude + tolerance),
            EnvironmentalData.longitude.between(longitude - tolerance, longitude + tolerance),
        )

    if date:
        try:
            parsed_date = datetime.strptime(date.strip(), "%Y-%m-%d").date()
            query = query.filter(EnvironmentalData.date == parsed_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: '{date}'. Date must follow YYYY-MM-DD.",
            )

    records = query.order_by(EnvironmentalData.date.desc(), EnvironmentalData.created_at.desc()).limit(limit).all()
    return records


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
