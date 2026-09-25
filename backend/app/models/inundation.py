from typing import Optional
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class InundationResult(Base):
    """
    Stores GIS inundation polygons, flooded areas, and maximum depth outputs
    derived from evaluated predictions.
    """
    __tablename__ = "inundation_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(
        Integer,
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    geojson = Column(Text, nullable=True)
    maximum_depth = Column(Float, nullable=True)
    flooded_area_km2 = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship: Prediction -> InundationResult
    prediction = relationship("Prediction", back_populates="inundation_results")

    # Compatibility properties
    @property
    def max_depth_m(self) -> Optional[float]:
        return self.maximum_depth

    @property
    def geojson_data(self) -> Optional[str]:
        return self.geojson

    def __repr__(self) -> str:
        return f"<InundationResult id={self.id} prediction_id={self.prediction_id} area={self.flooded_area_km2}km2>"


# Alias for backward compatibility
Inundation = InundationResult
