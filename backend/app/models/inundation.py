from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Inundation(Base):
    __tablename__ = "inundations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_request_id = Column(
        Integer,
        ForeignKey("prediction_requests.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    horizon_hours = Column(Integer, default=24, nullable=False)
    flooded_area_km2 = Column(Float, nullable=True)
    max_depth_m = Column(Float, nullable=True)
    avg_depth_m = Column(Float, nullable=True)
    geojson_data = Column(Text, nullable=True)  # Stored GeoJSON string or polygon features
    status = Column(String(50), default="PENDING_AI_MODEL", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    prediction_request = relationship("PredictionRequest", back_populates="inundations")

    def __repr__(self) -> str:
        return f"<Inundation id={self.id} request_id={self.prediction_request_id} area={self.flooded_area_km2}km2>"
