"""ARQ background worker — pool scoring + nightly recap."""

import asyncio
from datetime import timezone

from arq.connections import RedisSettings
from sqlalchemy import select

from app_config import settings
from db.models import Session as SessionModel
from db.models import User, UserCandidate
from db.session import AsyncSessionLocal
from services.pool_curator import (
    build_highlights,
    profile_to_text,
    requirements_to_text,
    score_candidate,
)
from services.recap_generator import generate_recap


async def compute_pool_scores(ctx: dict, user_id: str) -> None:
    """Background task: score all visible candidates for a user, cache to DB."""
    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if not user:
            return
        candidates_result = await db.execute(
            select(User)
            .where(User.id != user_id)
            .where(User.visibility == "active")
            .where(User.deleted_at.is_(None))
            .limit(100)
        )
        candidates = candidates_result.scalars().all()

        req_text = requirements_to_text(user)
        sem = asyncio.Semaphore(5)

        async def score_one(c: User) -> UserCandidate:
            async with sem:
                score = await score_candidate(req_text, profile_to_text(c))
                highlights = build_highlights(
                    {"city": user.city, "personality_tags": user.personality_tags or []},
                    {
                        "city": c.city,
                        "life_goals": c.life_goals,
                        "personality_tags": c.personality_tags or [],
                    },
                )
                return UserCandidate(
                    user_id=user_id, candidate_id=c.id, score=score, highlights=highlights
                )

        results = await asyncio.gather(*[score_one(c) for c in candidates])
        for r in results:
            db.add(r)
        await db.commit()


async def nightly_recap_batch(ctx: dict) -> None:
    """Run at 02:00 CST (18:00 UTC). Generate AI recaps for completed sessions."""
    async with AsyncSessionLocal() as db:
        sessions_result = await db.execute(
            select(SessionModel)
            .where(SessionModel.completed_at.is_not(None))
            .where(SessionModel.ai_recap.is_(None))
        )
        sessions = sessions_result.scalars().all()

        sem = asyncio.Semaphore(5)

        async def recap_one(s: SessionModel) -> None:
            async with sem:
                recap = await generate_recap(s.questions_completed or [], s.round_number)
                s.ai_recap = recap

        await asyncio.gather(*[recap_one(s) for s in sessions])
        await db.commit()


class WorkerSettings:
    functions = [compute_pool_scores, nightly_recap_batch]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [
        # nightly_recap at 02:00 UTC+8 = 18:00 UTC
        {"coroutine": nightly_recap_batch, "hour": 18, "minute": 0},
    ]
