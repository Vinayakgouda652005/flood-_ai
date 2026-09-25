from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
@router.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for the FastAPI service and PostgreSQL connection.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unavailable: {str(e)}"

    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
