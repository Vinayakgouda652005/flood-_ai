from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.inundation import InundationResponse, InundationCreate
from app.services.inundation_service import inundation_service

router = APIRouter(prefix="/api/inundation", tags=["Inundation"])


@router.get("", response_model=InundationResponse)
def get_inundation_layer(
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    request_id: Optional[int] = Query(None, description="Associated prediction request ID"),
    prediction_id: Optional[int] = Query(None, description="Associated prediction ID"),
    db: Session = Depends(get_db),
):
    """
    Retrieves spatial inundation polygons and depth maps for a prediction.
    Strictly queries stored records; returns available=False and geojson=null if no result exists.
    Never returns results belonging to another location or date.
    """
    if date:
        try:
            datetime.strptime(date.strip(), "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: '{date}'. Date must follow YYYY-MM-DD.",
            )

    return inundation_service.get_inundation(
        db=db,
        latitude=latitude,
        longitude=longitude,
        date=date,
        request_id=request_id,
        prediction_id=prediction_id,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def save_inundation_simulation(
    data: InundationCreate,
    db: Session = Depends(get_db),
):
    """
    Ingest hydraulic or GIS inundation simulation result linked to a prediction.
    """
    try:
        record = inundation_service.save_inundation(db=db, data=data)
        return {
            "message": "Inundation record saved successfully",
            "id": record.id,
            "prediction_id": record.prediction_id,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
