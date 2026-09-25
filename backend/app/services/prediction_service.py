import logging
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.location import Location
from app.models.prediction_request import PredictionRequest
from app.models.prediction import Prediction
from app.models.inundation import Inundation
from app.schemas.prediction import (
    PredictionRequestCreate,
    PredictionResponse,
    PredictionInundationSummary,
    PredictionHistoryItem,
)

logger = logging.getLogger("flood_backend.prediction_service")


class PredictionService:
    """
    Handles logging, querying, and execution lifecycle for flood predictions.

    IMPORTANT ARCHITECTURAL DIRECTIVE:
    - No fake AI prediction logic, random forest simulation, or pseudo-random probabilities.
    - AI model integration is isolated to the marked hook below.
    - Requests are recorded in PostgreSQL `prediction_requests` table with status 'PENDING_AI_MODEL'
      until the trained model is hooked in.
    """

    @staticmethod
    def get_or_create_location(
        db: Session,
        latitude: float,
        longitude: float,
        name: Optional[str] = None,
    ) -> Location:
        """
        Locates an existing location within a tight coordinate tolerance (~1km),
        or registers a new location record in the database.
        """
        # Coordinate match within ~0.01 degrees (~1.1 km)
        tolerance = 0.01
        location = (
            db.query(Location)
            .filter(
                Location.latitude.between(latitude - tolerance, latitude + tolerance),
                Location.longitude.between(longitude - tolerance, longitude + tolerance),
            )
            .first()
        )

        if not location:
            loc_name = name or f"Coordinates ({latitude:.4f}, {longitude:.4f})"
            location = Location(
                name=loc_name,
                latitude=round(latitude, 6),
                longitude=round(longitude, 6),
            )
            db.add(location)
            db.commit()
            db.refresh(location)
            logger.info(f"Registered new location in database: id={location.id} name='{location.name}'")
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
        Processes a user-driven prediction request:
        1. Resolves / creates location record in PostgreSQL.
        2. Logs prediction request in `prediction_requests`.
        3. Checks if an actual verified prediction or trained model output exists.
        4. If AI model is not yet connected, cleanly returns PENDING_AI_MODEL status
           without generating fake probabilities.
        """
        # Parse date
        try:
            pred_date = datetime.strptime(request_data.date, "%Y-%m-%d").date()
        except ValueError:
            pred_date = date.today()

        # Step 1: Ensure location is in database
        location = cls.get_or_create_location(
            db=db,
            latitude=request_data.latitude,
            longitude=request_data.longitude,
            name=request_data.location_name,
        )

        # Step 2: Log prediction request in PostgreSQL
        prediction_req = PredictionRequest(
            location_id=location.id,
            prediction_date=pred_date,
            status="PENDING_AI_MODEL",
        )
        db.add(prediction_req)
        db.commit()
        db.refresh(prediction_req)

        # Step 3: Check if a pre-computed or existing verified prediction exists
        existing_prediction = (
            db.query(Prediction)
            .filter(Prediction.prediction_request_id == prediction_req.id)
            .first()
        )

        # =====================================================================
        # FUTURE TRAINED AI MODEL INTEGRATION HOOK
        # =====================================================================
        # When the AI model (Random Forest / LightGBM / Neural Net) is trained:
        #
        # 1. Load model:
        #    model = joblib.load("models/trained_flood_rf_model.joblib")
        #
        # 2. Extract features from `environmental_data` table for `location.id` and `pred_date`:
        #    env_data = db.query(EnvironmentalData).filter(...).first()
        #    features = [
        #        env_data.rainfall_mm,
        #        env_data.river_discharge_m3s,
        #        env_data.water_level_m,
        #        env_data.elevation_m,
        #        ...
        #    ]
        #
        # 3. Generate genuine model inference:
        #    prob = float(model.predict_proba([features])[0][1])
        #    risk = "HIGH" if prob >= 0.75 else "MODERATE" if prob >= 0.4 else "LOW"
        #    flood_flag = 1 if prob >= 0.5 else 0
        #
        # 4. Save to `predictions` table:
        #    record = Prediction(
        #        prediction_request_id=prediction_req.id,
        #        flood_probability=prob,
        #        risk_level=risk,
        #        flood_occurred=flood_flag,
        #    )
        #    db.add(record)
        #    prediction_req.status = "COMPLETED"
        #    db.commit()
        # =====================================================================

        if existing_prediction:
            return PredictionResponse(
                latitude=location.latitude,
                longitude=location.longitude,
                date=str(pred_date),
                status="COMPLETED",
                message="Retrieved stored prediction record from database.",
                location_name=location.name,
                flood_probability=existing_prediction.flood_probability,
                risk_level=existing_prediction.risk_level or "UNKNOWN",
                flood_occurred=existing_prediction.flood_occurred,
                inundation=PredictionInundationSummary(available=False, geojson=None),
                request_id=prediction_req.id,
                created_at=prediction_req.created_at,
            )

        # Truthful response: request is logged in PostgreSQL; AI model inference is pending integration.
        return PredictionResponse(
            latitude=location.latitude,
            longitude=location.longitude,
            date=str(pred_date),
            status="PENDING_AI_MODEL",
            message="Prediction request logged to database successfully. AI model inference pending integration.",
            location_name=location.name,
            flood_probability=None,
            risk_level="PENDING",
            flood_occurred=None,
            inundation=PredictionInundationSummary(
                available=False,
                geojson=None,
            ),
            request_id=prediction_req.id,
            created_at=prediction_req.created_at,
        )

    @classmethod
    def get_history(cls, db: Session, limit: int = 50) -> List[PredictionHistoryItem]:
        """
        Retrieves recent prediction requests with associated location and prediction records.
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
        Retrieves a specific prediction request by ID.
        """
        req = db.query(PredictionRequest).filter(PredictionRequest.id == request_id).first()
        if not req:
            return None

        loc = req.location
        pred = req.prediction

        return PredictionResponse(
            latitude=loc.latitude if loc else 0.0,
            longitude=loc.longitude if loc else 0.0,
            date=str(req.prediction_date),
            status=req.status,
            message="Prediction request retrieved from database.",
            location_name=loc.name if loc else None,
            flood_probability=pred.flood_probability if pred else None,
            risk_level=pred.risk_level if pred else "PENDING",
            flood_occurred=pred.flood_occurred if pred else None,
            inundation=PredictionInundationSummary(available=False, geojson=None),
            request_id=req.id,
            created_at=req.created_at,
        )


prediction_service = PredictionService()
