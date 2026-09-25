import logging
from datetime import datetime, date
from typing import Optional, List, Union
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
    hydrometric, and meteorological observations in PostgreSQL.

    CRITICAL:
    - Never fabricates, estimates, or generates fake environmental readings.
    - Only stores real data explicitly posted to the API.
    - Only retrieves verified records stored in the database.
    """

    @staticmethod
    def get_environmental_forecast(
        db: Session,
        location_id: Optional[int] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        target_date: Optional[str] = None,
    ) -> ForecastResponse:
        query = db.query(EnvironmentalData)

        # 1. Filter by location_id if supplied
        if location_id is not None:
            query = query.filter(EnvironmentalData.location_id == location_id)
        # 2. Or filter by coordinates within spatial tolerance
        elif latitude is not None and longitude is not None:
            tolerance = 0.02  # ~2.2 km
            # First check if there is an exact or registered location
            loc = (
                db.query(Location)
                .filter(
                    Location.latitude.between(latitude - tolerance, latitude + tolerance),
                    Location.longitude.between(longitude - tolerance, longitude + tolerance),
                )
                .first()
            )
            if loc:
                query = query.filter(
                    (EnvironmentalData.location_id == loc.id) |
                    (EnvironmentalData.latitude.between(latitude - tolerance, latitude + tolerance) &
                     EnvironmentalData.longitude.between(longitude - tolerance, longitude + tolerance))
                )
            else:
                query = query.filter(
                    EnvironmentalData.latitude.between(latitude - tolerance, latitude + tolerance),
                    EnvironmentalData.longitude.between(longitude - tolerance, longitude + tolerance),
                )

        # 3. Filter by date if supplied
        if target_date:
            try:
                parsed_date = datetime.strptime(target_date.strip(), "%Y-%m-%d").date()
                query = query.filter(EnvironmentalData.date == parsed_date)
            except ValueError:
                pass

        records = query.order_by(EnvironmentalData.date.desc(), EnvironmentalData.created_at.desc()).limit(50).all()

        if not records:
            return ForecastResponse(
                location_id=location_id,
                latitude=latitude if latitude is not None else 0.0,
                longitude=longitude if longitude is not None else 0.0,
                target_date=target_date,
                has_records=False,
                records=[],
                message="No verified environmental observations found in database for the given criteria.",
            )

        response_records = [
            EnvironmentalDataResponse.model_validate(r) for r in records
        ]

        return ForecastResponse(
            location_id=location_id or (records[0].location_id if records else None),
            latitude=latitude if latitude is not None else records[0].latitude,
            longitude=longitude if longitude is not None else records[0].longitude,
            target_date=target_date,
            has_records=True,
            records=response_records,
            message="Verified environmental records retrieved from PostgreSQL.",
        )

    @staticmethod
    def record_environmental_data(
        db: Session,
        data: EnvironmentalDataCreate,
    ) -> EnvironmentalData:
        """
        Stores real environmental features into the database.
        If a record for (location_id, date) already exists, updates it
        to respect the database unique constraint cleanly.
        """
        # Parse date if string
        obs_date = data.date
        if isinstance(obs_date, str):
            obs_date = datetime.strptime(obs_date.strip(), "%Y-%m-%d").date()

        # Check existing record for location_id and date
        existing = (
            db.query(EnvironmentalData)
            .filter(
                EnvironmentalData.location_id == data.location_id,
                EnvironmentalData.date == obs_date,
            )
            .first()
        )

        infra_str = str(data.infrastructure) if data.infrastructure is not None else None

        if existing:
            existing.latitude = data.latitude
            existing.longitude = data.longitude
            existing.rainfall_mm = data.rainfall_mm
            existing.temperature_c = data.temperature_c
            existing.humidity_pct = data.humidity_pct
            existing.river_discharge_m3s = data.river_discharge_m3s
            existing.water_level_m = data.water_level_m
            existing.elevation_m = data.elevation_m
            existing.land_cover = data.land_cover
            existing.soil_type = data.soil_type
            existing.population_density = data.population_density
            existing.infrastructure = infra_str
            existing.historical_floods = data.historical_floods
            db.commit()
            db.refresh(existing)
            logger.info(f"Updated existing environmental record id={existing.id} for location {data.location_id}")
            return existing

        record = EnvironmentalData(
            location_id=data.location_id,
            date=obs_date,
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
            infrastructure=infra_str,
            historical_floods=data.historical_floods,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info(f"Created new environmental record id={record.id} for location {data.location_id}")
        return record


forecast_service = ForecastService()
