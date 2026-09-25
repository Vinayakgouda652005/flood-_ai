from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EnvironmentalData(Base):
    """
    Environmental and hydrometric feature table designed to store
    real ground-truth observation and meteorological forecast data
    used as inputs for the trained AI flood prediction model.
    """
    __tablename__ = "environmental_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Hydrological & Meteorological features (nullable - no automatic fake values)
    rainfall_mm = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    river_discharge_m3s = Column(Float, nullable=True)
    water_level_m = Column(Float, nullable=True)

    # Geophysical & Geospatial features
    elevation_m = Column(Float, nullable=True)
    land_cover = Column(String(100), nullable=True)
    soil_type = Column(String(100), nullable=True)

    # Socio-economic & Historical features
    population_density = Column(Float, nullable=True)
    infrastructure = Column(String(255), nullable=True)
    historical_floods = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    location = relationship("Location", back_populates="environmental_records")

    def __repr__(self) -> str:
        return f"<EnvironmentalData id={self.id} location_id={self.location_id} date={self.date} rain={self.rainfall_mm}>"
