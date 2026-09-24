"""
Sankshep.ai — Data persistence layer.

Provides user-scoped transformation logging, history retrieval,
and analytics summaries backed by PostgreSQL.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models import TransformationHistory

logger = logging.getLogger("sankshep.db")


async def log_transformation(
    db: AsyncSession,
    user_id: UUID,
    transformation_type: str,
    input_words: int,
    output_words: int,
    provider: Optional[str] = None,
    model: Optional[str] = None,
):
    """Log a completed transformation to the user's history."""
    try:
        record = TransformationHistory(
            user_id=user_id,
            transformation_type=transformation_type,
            provider=provider or "",
            model=model or "",
            input_word_count=input_words,
            output_word_count=output_words,
        )
        db.add(record)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log transformation: {e}")
        await db.rollback()


async def get_recent_history(db: AsyncSession, user_id: UUID, limit: int = 25):
    """Retrieve recent transformation history for a specific user."""
    try:
        result = await db.execute(
            select(TransformationHistory)
            .where(TransformationHistory.user_id == user_id)
            .order_by(desc(TransformationHistory.id))
            .limit(limit)
        )
        rows = result.scalars().all()
        return [
            {
                "id": r.id,
                "transformation_type": r.transformation_type,
                "provider": r.provider,
                "model": r.model,
                "input_words": r.input_word_count,
                "output_words": r.output_word_count,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Failed to retrieve history: {e}")
        return []


async def get_analytics_summary(db: AsyncSession, user_id: UUID):
    """Get aggregated analytics for a specific user's transformations."""
    try:
        # Totals
        result = await db.execute(
            select(
                func.count(TransformationHistory.id).label("total_runs"),
                func.coalesce(func.sum(TransformationHistory.input_word_count), 0).label("total_in"),
                func.coalesce(func.sum(TransformationHistory.output_word_count), 0).label("total_out"),
            ).where(TransformationHistory.user_id == user_id)
        )
        row = result.one()

        # Top formats
        top_result = await db.execute(
            select(
                TransformationHistory.transformation_type,
                func.count(TransformationHistory.id).label("count"),
            )
            .where(TransformationHistory.user_id == user_id)
            .group_by(TransformationHistory.transformation_type)
            .order_by(desc("count"))
            .limit(5)
        )
        top_formats = [{"type": r[0], "count": r[1]} for r in top_result.all()]

        return {
            "total_runs": row.total_runs or 0,
            "total_input_words": row.total_in or 0,
            "total_output_words": row.total_out or 0,
            "top_formats": top_formats,
        }
    except Exception as e:
        logger.error(f"Failed to retrieve analytics: {e}")
        return {
            "total_runs": 0,
            "total_input_words": 0,
            "total_output_words": 0,
            "top_formats": [],
        }