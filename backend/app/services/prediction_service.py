import logging
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.location import Location
from app.models.prediction_request import PredictionRequest
from app.models.prediction import Prediction
from app.models.environmental_data import EnvironmentalData
from app.models.inundation import InundationResult
from app.schemas.prediction import (
    PredictionRequestCreate,
    PredictionResponse,
    PredictionInundationSummary,
    PredictionHistoryItem,
    LocationNested,
)

logger = logging.getLogger("flood_backend.prediction_service")

# 13 features reserved for future AI model integration milestone
REQUIRED_MODEL_FEATURES = [
    "latitude",
    "longitude",
    "rainfall_mm",
    "temperature_c",
    "humidity_pct",
    "river_discharge_m3s",
    "water_level_m",
    "elevation_m",
    "land_cover",
    "soil_type",
    "population_density",
    "infrastructure",
    "historical_floods",
]


class PredictionService:
    """
    Handles validation, location resolution, and PostgreSQL logging
    for flood prediction requests.

    MILESTONE STATUS:
    - AI Model integration is deliberately deferred until database integration is verified.
    - Zero fake/synthetic probabilities or mock model results.
    - Logs requests to PostgreSQL with status 'WAITING_FOR_AI_MODEL'.
    """

    @staticmethod
    def classify_risk(flood_probability: Optional[float]) -> str:
        """
        Isolated risk classification policy reserved for future AI model inference.
        """
        if flood_probability is None:
            return "PENDING"
        if flood_probability >= 0.75:
            return "HIGH"
        elif flood_probability >= 0.40:
            return "MODERATE"
        return "LOW"

    PRESET_COORDINATES = [
        (12.9716, 77.5946, "Bengaluru, Karnataka"),
        (16.5062, 80.6480, "Vijayawada, Krishna Basin, Andhra Pradesh"),
        (25.5941, 85.1376, "Patna, Ganga Basin, Bihar"),
        (26.1445, 91.7362, "Guwahati, Brahmaputra Basin, Assam"),
        (20.4625, 85.8830, "Cuttack, Mahanadi Delta, Odisha"),
        (25.3176, 82.9739, "Varanasi, Middle Ganga, Uttar Pradesh"),
        (19.0760, 72.8777, "Mumbai, Mithi Basin, Maharashtra"),
        (13.0827, 80.2707, "Chennai, Adyar & Cooum Basins, Tamil Nadu"),
        (22.5726, 88.3639, "Kolkata, Hooghly Basin, West Bengal"),
        (28.6139, 77.2090, "Delhi, Yamuna Floodplain, NCR"),
        (34.0837, 74.7973, "Srinagar, Jhelum Basin, Jammu & Kashmir"),
        (21.1702, 72.8311, "Surat, Tapi Basin, Gujarat"),
        (9.9312, 76.2673, "Kochi, Periyar Basin, Kerala"),
        (17.3850, 78.4867, "Hyderabad, Musi Basin, Telangana"),
        (18.5204, 73.8567, "Pune, Mula-Mutha Basin, Maharashtra"),
        (23.0225, 72.5714, "Ahmedabad, Sabarmati Basin, Gujarat"),
    ]

    @classmethod
    def get_or_create_location(
        cls,
        db: Session,
        latitude: float,
        longitude: float,
        name: Optional[str] = None,
    ) -> Location:
        """
        Locates an existing location within ~500m coordinate tolerance,
        or registers a new location record in the PostgreSQL database.
        Prevents unnecessary duplicate location records.
        """
        tolerance = 0.005  # ~500m
        location = (
            db.query(Location)
            .filter(
                Location.latitude.between(latitude - tolerance, latitude + tolerance),
                Location.longitude.between(longitude - tolerance, longitude + tolerance),
            )
            .first()
        )

        if not location:
            loc_name = name
            if not loc_name:
                for p_lat, p_lon, p_name in cls.PRESET_COORDINATES:
                    if abs(latitude - p_lat) < 0.05 and abs(longitude - p_lon) < 0.05:
                        loc_name = p_name
                        break
            if not loc_name:
                loc_name = f"Coordinates ({latitude:.4f}, {longitude:.4f})"

            location = Location(
                name=loc_name,
                latitude=round(latitude, 6),
                longitude=round(longitude, 6),
            )
            db.add(location)
            db.commit()
            db.refresh(location)
            logger.info(f"Registered new location in PostgreSQL: id={location.id} name='{location.name}'")
        elif name and (location.name.startswith("Coordinates (") or not location.name):
            location.name = name
            db.commit()
            db.refresh(location)

        return location

    @classmethod
    def process_prediction_request(
        cls,
        db: Session,
        request_data: PredictionRequestCreate,
    ) -> PredictionResponse:
        """
        Database-only prediction request lifecycle:
        1. Validate latitude and longitude.
        2. Validate date strictly (HTTP 400 for invalid formats).
        3. Find or create location in PostgreSQL.
        4. Create a prediction_request record with status 'WAITING_FOR_AI_MODEL'.
        5. Return prediction request information without calling AI model.
        """
        # Step 1: Validate latitude and longitude
        lat = request_data.latitude
        lon = request_data.longitude
        if lat < -90.0 or lat > 90.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid latitude: {lat}. Must be between -90 and 90.",
            )
        if lon < -180.0 or lon > 180.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid longitude: {lon}. Must be between -180 and 180.",
            )

        # Step 2: Validate date strictly (strict YYYY-MM-DD, HTTP 400 on error)
        raw_date = request_data.date
        if not raw_date or not isinstance(raw_date, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date must be provided as a non-empty YYYY-MM-DD string.",
            )
        try:
            pred_date = datetime.strptime(raw_date.strip(), "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: '{raw_date}'. Prediction date must strictly follow YYYY-MM-DD format.",
            )

        # Step 3: Find or create location in PostgreSQL
        loc_name = request_data.location_name or request_data.name
        location = cls.get_or_create_location(
            db=db,
            latitude=lat,
            longitude=lon,
            name=loc_name,
        )

        # Step 4: Create prediction_request record in PostgreSQL
        prediction_req = PredictionRequest(
            location_id=location.id,
            prediction_date=pred_date,
            status="WAITING_FOR_AI_MODEL",
        )
        db.add(prediction_req)
        db.commit()
        db.refresh(prediction_req)
        logger.info(
            f"Logged prediction request in PostgreSQL: id={prediction_req.id}, "
            f"location_id={location.id}, date={pred_date}, status='WAITING_FOR_AI_MODEL'"
        )

        # Step 5: Check if an evaluated prediction already exists in DB
        existing_prediction = (
            db.query(Prediction)
            .filter(Prediction.prediction_request_id == prediction_req.id)
            .first()
        )

        flood_prob = existing_prediction.flood_probability if existing_prediction else None
        risk = existing_prediction.risk_level if existing_prediction else "PENDING"
        occurred = existing_prediction.flood_occurred if existing_prediction else None
        current_status = "COMPLETED" if (existing_prediction and flood_prob is not None) else "WAITING_FOR_AI_MODEL"

        # Step 6: Return database-backed request info (DO NOT generate fake probability)
        return PredictionResponse(
            status=current_status,
            prediction_request_id=prediction_req.id,
            location=LocationNested(
                name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
            ),
            date=str(pred_date),
            request_id=prediction_req.id,
            latitude=location.latitude,
            longitude=location.longitude,
            location_name=location.name,
            flood_probability=flood_prob,
            risk_level=risk,
            flood_occurred=occurred,
            inundation=PredictionInundationSummary(available=False, geojson=None),
            message="Prediction request recorded in PostgreSQL. WAITING_FOR_AI_MODEL.",
            created_at=prediction_req.created_at,
        )

    @classmethod
    def get_history(cls, db: Session, limit: int = 50) -> List[PredictionHistoryItem]:
        """
        Retrieves recent prediction requests with associated location from PostgreSQL.
        """
        results = (
            db.query(PredictionRequest)
            .join(Location, PredictionRequest.location_id == Location.id)
            .outerjoin(Prediction, Prediction.prediction_request_id == PredictionRequest.id)
            .order_by(desc(PredictionRequest.created_at))
            .limit(limit)
            .all()
        )

        history = []
        for req in results:
            pred = req.prediction
            history.append(
                PredictionHistoryItem(
                    id=req.id,
                    location_id=req.location_id,
                    location_name=req.location.name if req.location else None,
                    latitude=req.location.latitude if req.location else 0.0,
                    longitude=req.location.longitude if req.location else 0.0,
                    prediction_date=req.prediction_date,
                    status=req.status,
                    created_at=req.created_at,
                    flood_probability=pred.flood_probability if pred else None,
                    risk_level=pred.risk_level if pred else None,
                    flood_occurred=pred.flood_occurred if pred else None,
                )
            )

        return history

    @classmethod
    def get_by_id(cls, db: Session, request_id: int) -> Optional[PredictionResponse]:
        """
        Retrieves a specific prediction request by ID from PostgreSQL.
        """
        req = db.query(PredictionRequest).filter(PredictionRequest.id == request_id).first()
        if not req:
            return None

        loc = req.location
        pred = req.prediction

        return PredictionResponse(
            status=req.status,
            prediction_request_id=req.id,
            location=LocationNested(
                name=loc.name if loc else "Unknown",
                latitude=loc.latitude if loc else 0.0,
                longitude=loc.longitude if loc else 0.0,
            ),
            date=str(req.prediction_date),
            request_id=req.id,
            latitude=loc.latitude if loc else 0.0,
            longitude=loc.longitude if loc else 0.0,
            location_name=loc.name if loc else None,
            flood_probability=pred.flood_probability if pred else None,
            risk_level=pred.risk_level if pred else "PENDING",
            flood_occurred=pred.flood_occurred if pred else None,
            inundation=PredictionInundationSummary(available=False, geojson=None),
            message="Prediction request retrieved from database.",
            created_at=req.created_at,
        )


prediction_service = PredictionService()
