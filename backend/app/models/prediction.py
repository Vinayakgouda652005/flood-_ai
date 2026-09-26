from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_request_id = Column(
        Integer,
        ForeignKey("prediction_requests.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    # Nullable until AI model inference milestone
    flood_probability = Column(Float, nullable=True)
    flood_occurred = Column(Integer, nullable=True)
    risk_level = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    prediction_request = relationship("PredictionRequest", back_populates="prediction")
    inundation_results = relationship(
        "InundationResult",
        back_populates="prediction",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Prediction id={self.id} request_id={self.prediction_request_id} prob={self.flood_probability} risk={self.risk_level}>"


# Re-export PredictionRequest for flexible imports
from app.models.prediction_request import PredictionRequest  # noqa: E402, F401
