import logging
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.environmental_data import EnvironmentalData
from app.schemas.forecast import (
    ForecastResponse,
    EnvironmentalDataResponse,
    EnvironmentalDataCreate,
)

logger = logging.getLogger("flood_backend.forecast_service")


class ForecastService:
    """
    Service responsible for querying and storing real environmental,
    hydrometric, and meteorological observations.

    IMPORTANT: Does NOT fabricate or generate fake environmental readings.
    Returns only verified records present in the database.
    """

    @staticmethod
    def get_environmental_forecast(
        db: Session,
        latitude: float,
        longitude: float,
        target_date: Optional[str] = None,
    ) -> ForecastResponse:
        tolerance = 0.05  # ~5.5 km radius

        # Find matching location
        location = (
            db.query(Location)
            .filter(
                Location.latitude.between(latitude - tolerance, latitude + tolerance),
                Location.longitude.between(longitude - tolerance, longitude + tolerance),
            )
            .first()
        )

        query = db.query(EnvironmentalData)

        if location:
            query = query.filter(EnvironmentalData.location_id == location.id)
        else:
            query = query.filter(
                EnvironmentalData.latitude.between(latitude - tolerance, latitude + tolerance),
                EnvironmentalData.longitude.between(longitude - tolerance, longitude + tolerance),
            )

        if target_date:
            try:
                parsed_date = datetime.strptime(target_date, "%Y-%m-%d").date()
                query = query.filter(EnvironmentalData.date == parsed_date)
            except ValueError:
                pass

        records = query.order_by(EnvironmentalData.date.desc()).limit(30).all()

        if not records:
            return ForecastResponse(
                location_id=location.id if location else None,
                latitude=latitude,
                longitude=longitude,
                target_date=target_date,
                has_records=False,
                records=[],
                message="No verified environmental observations found in database for the given coordinates.",
            )

        response_records = [
            EnvironmentalDataResponse.model_validate(r) for r in records
        ]

        return ForecastResponse(
            location_id=location.id if location else None,
            latitude=latitude,
            longitude=longitude,
            target_date=target_date,
            has_records=True,
            records=response_records,
            message="Verified environmental records retrieved from database.",
        )

    @staticmethod
    def record_environmental_data(
        db: Session,
        data: EnvironmentalDataCreate,
    ) -> EnvironmentalData:
        """
        Stores real environmental features into the database.
        """
        record = EnvironmentalData(
            location_id=data.location_id,
            date=data.date,
            latitude=data.latitude,
            longitude=data.longitude,
            rainfall_mm=data.rainfall_mm,
            temperature_c=data.temperature_c,
            humidity_pct=data.humidity_pct,
            river_discharge_m3s=data.river_discharge_m3s,
            water_level_m=data.water_level_m,
            elevation_m=data.elevation_m,
            land_cover=data.land_cover,
            soil_type=data.soil_type,
            population_density=data.population_density,
            infrastructure=data.infrastructure,
            historical_floods=data.historical_floods,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


forecast_service = ForecastService()
