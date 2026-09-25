from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.inundation import InundationResponse, InundationCreate
from app.services.inundation_service import inundation_service

router = APIRouter(prefix="/api/inundation", tags=["Inundation"])


@router.get("", response_model=InundationResponse)
def get_inundation_layer(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    request_id: Optional[int] = Query(None, description="Associated prediction request ID"),
    db: Session = Depends(get_db),
):
    """
    Retrieves spatial inundation polygons and depth maps for a prediction request.
    Returns available=False if no hydrodynamic simulation has been run and stored.
    """
    return inundation_service.get_inundation(
        db=db,
        latitude=latitude,
        longitude=longitude,
        date=date,
        request_id=request_id,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def save_inundation_simulation(
    data: InundationCreate,
    db: Session = Depends(get_db),
):
    """
    Ingest hydraulic or GIS inundation simulation result.
    """
    record = inundation_service.save_inundation(db=db, data=data)
    return {"message": "Inundation record saved successfully", "id": record.id}
