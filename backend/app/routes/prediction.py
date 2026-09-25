from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.prediction import Prediction
from app.models.prediction_request import PredictionRequest
from app.schemas.prediction import (
    PredictionRequestCreate,
    PredictionResponse,
    PredictionHistoryItem,
    PredictionRecordCreate,
)
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/api/predict", tags=["Prediction"])


@router.post("", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
def predict_flood(
    request_data: PredictionRequestCreate,
    db: Session = Depends(get_db),
):
    """
    Primary user-driven flood prediction endpoint.
    Called by the React frontend when the user clicks 'Predict Flood'.

    Logs the request into PostgreSQL `prediction_requests` table.
    In accordance with system specifications:
    - Does NOT fabricate pseudo-random probabilities or fake AI simulations.
    - Stores prediction request in PostgreSQL with status 'WAITING_FOR_AI_MODEL'.
    - AI model integration is kept for subsequent milestone.
    """
    return prediction_service.process_prediction_request(
        db=db,
        request_data=request_data,
    )


@router.get("/history", response_model=List[PredictionHistoryItem])
def get_prediction_history(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Retrieve historical prediction requests and their statuses.
    """
    return prediction_service.get_history(db=db, limit=limit)


@router.get("/{request_id}", response_model=PredictionResponse)
def get_prediction_by_id(
    request_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve a specific prediction request by its ID.
    """
    res = prediction_service.get_by_id(db=db, request_id=request_id)
    if not res:
        raise HTTPException(status_code=404, detail="Prediction request not found")
    return res


@router.post("/record", status_code=status.HTTP_201_CREATED)
def record_prediction_result(
    record: PredictionRecordCreate,
    db: Session = Depends(get_db),
):
    """
    Ingestion endpoint for the future trained AI model to record evaluated predictions.
    Updates the prediction_request status to COMPLETED.
    """
    req = db.query(PredictionRequest).filter(PredictionRequest.id == record.prediction_request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Prediction request ID does not exist")

    existing_pred = db.query(Prediction).filter(Prediction.prediction_request_id == req.id).first()
    if existing_pred:
        existing_pred.flood_probability = record.flood_probability
        existing_pred.risk_level = record.risk_level
        existing_pred.flood_occurred = record.flood_occurred
    else:
        new_pred = Prediction(
            prediction_request_id=req.id,
            flood_probability=record.flood_probability,
            risk_level=record.risk_level,
            flood_occurred=record.flood_occurred,
        )
        db.add(new_pred)

    req.status = "COMPLETED"
    db.commit()

    return {"message": "Prediction record saved successfully", "request_id": req.id}
