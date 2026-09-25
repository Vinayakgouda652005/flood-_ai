from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationResponse

router = APIRouter(prefix="/api/locations", tags=["Locations"])


@router.get("", response_model=List[LocationResponse])
def get_locations(
    query: Optional[str] = Query(None, description="Search term for location name"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Retrieve stored locations or search by name.
    """
    db_query = db.query(Location)
    if query and query.strip():
        db_query = db_query.filter(Location.name.ilike(f"%{query.strip()}%"))
    return db_query.order_by(Location.name.asc()).limit(limit).all()


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    location: LocationCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new location in the PostgreSQL database.
    """
    # Check if duplicate exists within 0.005 deg (~500m)
    existing = (
        db.query(Location)
        .filter(
            Location.latitude.between(location.latitude - 0.005, location.latitude + 0.005),
            Location.longitude.between(location.longitude - 0.005, location.longitude + 0.005),
        )
        .first()
    )
    if existing:
        return existing

    new_loc = Location(
        name=location.name,
        latitude=round(location.latitude, 6),
        longitude=round(location.longitude, 6),
    )
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc


@router.get("/{location_id}", response_model=LocationResponse)
def get_location_by_id(
    location_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve a location by ID.
    """
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location
