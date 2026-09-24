import os
import logging
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from dotenv import load_dotenv

from models import Base

load_dotenv()

logger = logging.getLogger("sankshep.database")

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    logger.warning(
        "DATABASE_URL is not set. PostgreSQL features (auth, user history) will not work. "
        "Set DATABASE_URL in your .env file."
    )

# Create async engine — only if DATABASE_URL is provided
engine = None
async_session_factory = None

if DATABASE_URL:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
    async_session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def init_db():
    """Create all database tables if they don't exist."""
    if engine is None:
        logger.error("Cannot initialize database: DATABASE_URL is not configured.")
        return
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("PostgreSQL database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def get_db():
    """FastAPI dependency that yields an async database session."""
    if async_session_factory is None:
        raise RuntimeError(
            "Database is not configured. Set DATABASE_URL in your .env file."
        )
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
