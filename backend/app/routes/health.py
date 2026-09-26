import logging
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger("flood_backend.health")

router = APIRouter(tags=["Health"])


@router.get("/health")
@router.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for the FastAPI service and PostgreSQL connection.
    Executes SELECT 1 on PostgreSQL to verify real connectivity.
    """
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "service": settings.PROJECT_NAME,
            "database": "connected",
        }
    except Exception as e:
        logger.error(f"PostgreSQL health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "service": settings.PROJECT_NAME,
                "database": f"error: {str(e)}",
            },
        )

