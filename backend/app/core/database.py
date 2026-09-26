import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from app.core.config import settings

logger = logging.getLogger("flood_backend.database")

# Ensure PostgreSQL dialect URL format
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
except Exception as e:
    logger.error(f"Failed to create PostgreSQL engine for URL '{db_url}': {e}")
    raise RuntimeError(
        f"Database connection error: Could not initialize PostgreSQL engine with DATABASE_URL from backend/.env. "
        f"Error details: {e}. Please ensure PostgreSQL is running and credentials in backend/.env are correct."
    ) from e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request,
    ensuring proper cleanup when finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initializes required database tables in PostgreSQL.
    Strictly uses PostgreSQL. If PostgreSQL is unreachable, raises a clear error.
    """
    try:
        # Import models here to register all table metadata with Base
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL database tables verified and initialized successfully.")
    except (OperationalError, SQLAlchemyError) as e:
        error_msg = (
            f"Database connection error: Failed to connect to PostgreSQL database and create tables. "
            f"Please verify that the PostgreSQL server is running and reachable using DATABASE_URL "
            f"configured in backend/.env. Details: {e}"
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e
