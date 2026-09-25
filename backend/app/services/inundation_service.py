import json
import logging
from typing import Optional, Any
from sqlalchemy.orm import Session

from app.models.inundation import Inundation
from app.models.prediction_request import PredictionRequest
from app.schemas.inundation import InundationResponse, InundationCreate

logger = logging.getLogger("flood_backend.inundation_service")


class InundationService:
    """
    Manages spatial inundation geometries, depth maps, and flooded area projections.
    """

    @staticmethod
    def get_inundation(
        db: Session,
        latitude: float,
        longitude: float,
        date: Optional[str] = None,
        request_id: Optional[int] = None,
    ) -> InundationResponse:
        inundation: Optional[Inundation] = None

        if request_id:
            inundation = (
                db.query(Inundation)
                .filter(Inundation.prediction_request_id == request_id)
                .first()
            )

        if not inundation:
            # Query most recent inundation associated with a nearby prediction request
            query = (
                db.query(Inundation)
                .join(PredictionRequest, Inundation.prediction_request_id == PredictionRequest.id)
            )
            inundation = query.order_by(Inundation.created_at.desc()).first()

        if not inundation or not inundation.geojson_data:
            return InundationResponse(
                available=False,
                prediction_request_id=request_id,
                horizon_hours=24,
                flooded_area_km2=None,
                max_depth_m=None,
                avg_depth_m=None,
                geojson=None,
                message="No spatial inundation projection computed yet in database.",
            )

        # Parse stored GeoJSON
        try:
            parsed_geojson = json.loads(inundation.geojson_data) if isinstance(inundation.geojson_data, str) else inundation.geojson_data
        except Exception as e:
            logger.warning(f"Error parsing GeoJSON data for inundation {inundation.id}: {e}")
            parsed_geojson = None

        return InundationResponse(
            available=True,
            prediction_request_id=inundation.prediction_request_id,
            horizon_hours=inundation.horizon_hours,
            flooded_area_km2=inundation.flooded_area_km2,
            max_depth_m=inundation.max_depth_m,
            avg_depth_m=inundation.avg_depth_m,
            geojson=parsed_geojson,
            message="Inundation spatial projection retrieved successfully.",
        )

    @staticmethod
    def save_inundation(
        db: Session,
        data: InundationCreate,
    ) -> Inundation:
        record = Inundation(
            prediction_request_id=data.prediction_request_id,
            horizon_hours=data.horizon_hours,
            flooded_area_km2=data.flooded_area_km2,
            max_depth_m=data.max_depth_m,
            avg_depth_m=data.avg_depth_m,
            geojson_data=data.geojson_data,
            status=data.status,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


inundation_service = InundationService()
