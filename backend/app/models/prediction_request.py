from sqlalchemy import Column, Integer, Date, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PredictionRequest(Base):
    __tablename__ = "prediction_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_date = Column(Date, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="PENDING_AI_MODEL")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    location = relationship("Location", back_populates="prediction_requests")
    prediction = relationship(
        "Prediction",
        back_populates="prediction_request",
        uselist=False,
        cascade="all, delete-orphan",
    )
    inundations = relationship(
        "Inundation",
        back_populates="prediction_request",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<PredictionRequest id={self.id} location_id={self.location_id} date={self.prediction_date} status='{self.status}'>"
