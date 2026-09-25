import json
import logging
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session

from app.models.inundation import InundationResult
from app.models.prediction import Prediction
from app.models.prediction_request import PredictionRequest
from app.models.location import Location
from app.schemas.inundation import InundationResponse, InundationCreate

logger = logging.getLogger("flood_backend.inundation_service")


class InundationService:
    """
    Manages spatial inundation geometries, depth maps, and flooded area projections.

    STRICT RETRIEVAL POLICY:
    - Never return the latest inundation record globally.
    - Inundation results must strictly correspond to the requested prediction_id,
      prediction_request_id, or the exact location + date.
    - If no result exists: return available=False and geojson=null.
    """

    @staticmethod
    def get_inundation(
        db: Session,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        date: Optional[str] = None,
        request_id: Optional[int] = None,
        prediction_id: Optional[int] = None,
    ) -> InundationResponse:
        inundation: Optional[InundationResult] = None

        if prediction_id is not None:
            # 1. Match strictly by prediction_id
            inundation = (
                db.query(InundationResult)
                .filter(InundationResult.prediction_id == prediction_id)
                .first()
            )
        elif request_id is not None:
            # 2. Match strictly by prediction_request_id via Prediction
            inundation = (
                db.query(InundationResult)
                .join(Prediction, InundationResult.prediction_id == Prediction.id)
                .filter(Prediction.prediction_request_id == request_id)
                .first()
            )
        elif date and latitude is not None and longitude is not None:
            # 3. Match strictly by exact location coordinates and date
            try:
                parsed_date = datetime.strptime(date.strip(), "%Y-%m-%d").date()
                coord_tolerance = 0.01  # strict ~1km tolerance
                inundation = (
                    db.query(InundationResult)
                    .join(Prediction, InundationResult.prediction_id == Prediction.id)
                    .join(PredictionRequest, Prediction.prediction_request_id == PredictionRequest.id)
                    .join(Location, PredictionRequest.location_id == Location.id)
                    .filter(
                        PredictionRequest.prediction_date == parsed_date,
                        Location.latitude.between(latitude - coord_tolerance, latitude + coord_tolerance),
                        Location.longitude.between(longitude - coord_tolerance, longitude + coord_tolerance),
                    )
                    .first()
                )
            except ValueError:
                inundation = None

        # Strictly return available=False if no exact matching record is in PostgreSQL
        if not inundation or not inundation.geojson:
            return InundationResponse(
                available=False,
                geojson=None,
                maximum_depth=None,
                flooded_area_km2=None,
                prediction_id=prediction_id,
                prediction_request_id=request_id,
                message="No inundation record exists for the requested parameters.",
            )

        # Parse stored GeoJSON if stored as text
        parsed_geojson = None
        try:
            if isinstance(inundation.geojson, str):
                parsed_geojson = json.loads(inundation.geojson)
            else:
                parsed_geojson = inundation.geojson
        except Exception as e:
            logger.warning(f"Error parsing GeoJSON data for inundation {inundation.id}: {e}")
            parsed_geojson = None

        return InundationResponse(
            available=True,
            geojson=parsed_geojson,
            maximum_depth=inundation.maximum_depth,
            flooded_area_km2=inundation.flooded_area_km2,
            prediction_id=inundation.prediction_id,
            prediction_request_id=request_id,
            message="Inundation spatial result retrieved from database.",
        )

    @staticmethod
    def save_inundation(
        db: Session,
        data: InundationCreate,
    ) -> InundationResult:
        """
        Stores verified inundation simulation result.
        """
        # Resolve prediction_id if prediction_request_id was provided
        pred_id = data.prediction_id
        if pred_id is None and data.prediction_request_id is not None:
            pred = db.query(Prediction).filter(Prediction.prediction_request_id == data.prediction_request_id).first()
            if pred:
                pred_id = pred.id
            else:
                # Create a placeholder prediction record linked to the request if none exists yet
                new_pred = Prediction(
                    prediction_request_id=data.prediction_request_id,
                    flood_probability=None,
                    risk_level="PENDING",
                )
                db.add(new_pred)
                db.commit()
                db.refresh(new_pred)
                pred_id = new_pred.id

        if pred_id is None:
            raise ValueError("prediction_id or valid prediction_request_id is required to store inundation result.")

        record = InundationResult(
            prediction_id=pred_id,
            geojson=data.geojson,
            maximum_depth=data.maximum_depth,
            flooded_area_km2=data.flooded_area_km2,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


inundation_service = InundationService()
