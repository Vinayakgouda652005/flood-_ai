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
from app.models.inundation import Inundation
from app.schemas.prediction import (
    PredictionRequestCreate,
    PredictionResponse,
    PredictionInundationSummary,
    PredictionHistoryItem,
)
from app.services.model_service import model_service

logger = logging.getLogger("flood_backend.prediction_service")

# Exact 13 features required before AI model inference
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
    Handles logging, feature validation, and execution lifecycle for flood predictions.

    STRICT DIRECTIVES:
    - Return HTTP 400 for an invalid YYYY-MM-DD date (never silently convert to today's date).
    - Look up verified environmental data from PostgreSQL; NEVER synthesize or fake environmental data.
    - Validate all 13 required model features before attempting AI inference.
    - Do not fill missing model features with fake values.
    - If environmental data or required features are missing, return a truthful data-unavailable response.
    - Keep risk classification isolated in this service so it can be calibrated when the model is trained.
    - Call model_service to execute inference when model is loaded.
    - Store real predictions in the database and return truthful responses.
    """

    @staticmethod
    def classify_risk(flood_probability: Optional[float]) -> str:
        """
        Isolated risk classification policy.
        Can be easily adjusted or calibrated once the trained model's ROC/PR curves are finalized.
        """
        if flood_probability is None:
            return "PENDING"
        if flood_probability >= 0.75:
            return "HIGH"
        elif flood_probability >= 0.40:
            return "MODERATE"
        return "LOW"

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
        tolerance = 0.01  # ~1.1 km
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
        Processes a user-driven prediction request with end-to-end truthfulness:
        1. Validates the request date strictly (HTTP 400 on invalid format).
        2. Resolves / registers location in PostgreSQL.
        3. Logs prediction request in `prediction_requests`.
        4. Retrieves real environmental data for (location_id, date).
        5. Validates that all 13 required model features are available (no fake values).
        6. Calls model_service to execute inference.
        7. Classifies risk using isolated classification policy.
        8. Stores prediction in database and returns the result.
        """
        # Step 1: Validate date strictly
        raw_date = request_data.date
        if not raw_date or not isinstance(raw_date, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date must be provided as a YYYY-MM-DD string.",
            )
        try:
            pred_date = datetime.strptime(raw_date.strip(), "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: '{raw_date}'. Prediction date must strictly follow YYYY-MM-DD format.",
            )

        # Step 2: Ensure location exists in database
        location = cls.get_or_create_location(
            db=db,
            latitude=request_data.latitude,
            longitude=request_data.longitude,
            name=request_data.location_name,
        )

        # Step 3: Log prediction request in PostgreSQL
        prediction_req = PredictionRequest(
            location_id=location.id,
            prediction_date=pred_date,
            status="PENDING_AI_MODEL",
        )
        db.add(prediction_req)
        db.commit()
        db.refresh(prediction_req)

        # Step 4: Check if an existing evaluated prediction record is already saved for this request
        existing_prediction = (
            db.query(Prediction)
            .filter(Prediction.prediction_request_id == prediction_req.id)
            .first()
        )
        if existing_prediction:
            return PredictionResponse(
                latitude=location.latitude,
                longitude=location.longitude,
                date=str(pred_date),
                status="COMPLETED",
                message="Retrieved existing prediction record from database.",
                location_name=location.name,
                flood_probability=existing_prediction.flood_probability,
                risk_level=existing_prediction.risk_level or "UNKNOWN",
                flood_occurred=existing_prediction.flood_occurred,
                inundation=PredictionInundationSummary(available=False, geojson=None),
                request_id=prediction_req.id,
                created_at=prediction_req.created_at,
            )

        # Step 5: Retrieve real environmental data for location and date
        env_record = (
            db.query(EnvironmentalData)
            .filter(
                EnvironmentalData.location_id == location.id,
                EnvironmentalData.date == pred_date,
            )
            .first()
        )

        if not env_record:
            # Also check by tight coordinate match for the date in case coordinates were registered nearby
            coord_tolerance = 0.01
            env_record = (
                db.query(EnvironmentalData)
                .filter(
                    EnvironmentalData.date == pred_date,
                    EnvironmentalData.latitude.between(location.latitude - coord_tolerance, location.latitude + coord_tolerance),
                    EnvironmentalData.longitude.between(location.longitude - coord_tolerance, location.longitude + coord_tolerance),
                )
                .first()
            )

        if not env_record:
            # Truthful response: real environmental data is not yet available for this location & date
            prediction_req.status = "DATA_UNAVAILABLE"
            db.commit()
            return PredictionResponse(
                latitude=location.latitude,
                longitude=location.longitude,
                date=str(pred_date),
                status="DATA_UNAVAILABLE",
                message=(
                    f"Environmental data is unavailable for location '{location.name}' on {pred_date}. "
                    "Actual hydrometric and meteorological observations must be ingested before inference."
                ),
                location_name=location.name,
                flood_probability=None,
                risk_level="PENDING",
                flood_occurred=None,
                inundation=PredictionInundationSummary(available=False, geojson=None),
                request_id=prediction_req.id,
                created_at=prediction_req.created_at,
            )

        # Step 6: Validate that all 13 required features are present and non-null (no fake values!)
        feature_dict = {
            "latitude": env_record.latitude,
            "longitude": env_record.longitude,
            "rainfall_mm": env_record.rainfall_mm,
            "temperature_c": env_record.temperature_c,
            "humidity_pct": env_record.humidity_pct,
            "river_discharge_m3s": env_record.river_discharge_m3s,
            "water_level_m": env_record.water_level_m,
            "elevation_m": env_record.elevation_m,
            "land_cover": env_record.land_cover,
            "soil_type": env_record.soil_type,
            "population_density": env_record.population_density,
            "infrastructure": env_record.infrastructure,
            "historical_floods": env_record.historical_floods,
        }

        missing_features = [
            feat_name for feat_name, feat_val in feature_dict.items() if feat_val is None
        ]

        if missing_features:
            prediction_req.status = "INCOMPLETE_FEATURES"
            db.commit()
            return PredictionResponse(
                latitude=location.latitude,
                longitude=location.longitude,
                date=str(pred_date),
                status="INCOMPLETE_FEATURES",
                message=(
                    f"Missing required model features: {', '.join(missing_features)}. "
                    "Features cannot be filled with fake values."
                ),
                location_name=location.name,
                flood_probability=None,
                risk_level="PENDING",
                flood_occurred=None,
                inundation=PredictionInundationSummary(available=False, geojson=None),
                request_id=prediction_req.id,
                created_at=prediction_req.created_at,
            )

        # Step 7: Check model availability and execute inference via model_service
        if not model_service.is_model_available:
            prediction_req.status = "PENDING_AI_MODEL"
            db.commit()
            return PredictionResponse(
                latitude=location.latitude,
                longitude=location.longitude,
                date=str(pred_date),
                status="PENDING_AI_MODEL",
                message=(
                    "Environmental features are verified and complete. "
                    "AI model artifact ('flood_prediction_model.pkl') is pending placement in backend/models/."
                ),
                location_name=location.name,
                flood_probability=None,
                risk_level="PENDING",
                flood_occurred=None,
                inundation=PredictionInundationSummary(available=False, geojson=None),
                request_id=prediction_req.id,
                created_at=prediction_req.created_at,
            )

        inference_result = model_service.predict(feature_dict)
        if not inference_result.get("success"):
            prediction_req.status = "INFERENCE_FAILED"
            db.commit()
            return PredictionResponse(
                latitude=location.latitude,
                longitude=location.longitude,
                date=str(pred_date),
                status="INFERENCE_FAILED",
                message=inference_result.get("message", "Model inference failed."),
                location_name=location.name,
                flood_probability=None,
                risk_level="PENDING",
                flood_occurred=None,
                inundation=PredictionInundationSummary(available=False, geojson=None),
                request_id=prediction_req.id,
                created_at=prediction_req.created_at,
            )

        # Step 8: Apply isolated risk classification & persist prediction
        prob = inference_result["flood_probability"]
        flood_flag = inference_result["flood_occurred"]
        risk = cls.classify_risk(prob)

        new_pred = Prediction(
            prediction_request_id=prediction_req.id,
            flood_probability=prob,
            risk_level=risk,
            flood_occurred=flood_flag,
        )
        db.add(new_pred)
        prediction_req.status = "COMPLETED"
        db.commit()
        db.refresh(new_pred)

        return PredictionResponse(
            latitude=location.latitude,
            longitude=location.longitude,
            date=str(pred_date),
            status="COMPLETED",
            message="Flood prediction successfully generated by AI model.",
            location_name=location.name,
            flood_probability=prob,
            risk_level=risk,
            flood_occurred=flood_flag,
            inundation=PredictionInundationSummary(available=False, geojson=None),
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
