from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, not_

from api.auth import get_current_user
from app_config import settings
from db.models import Approach, User, UserCandidate
from db.session import get_db
from services.pool_curator import (
    build_highlights,
    profile_to_text,
    requirements_to_text,
    score_candidate,
)

router = APIRouter()


@router.get("")
async def get_pool(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return top 20 pre-scored candidates. Inline score if no cached rows."""
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.pool_cache_ttl_seconds)
    cached = await db.execute(
        select(UserCandidate)
        .where(UserCandidate.user_id == current_user.id)
        .where(UserCandidate.scored_at > cutoff)
        .order_by(UserCandidate.score.desc())
        .limit(20)
    )
    rows = cached.scalars().all()

    if not rows:
        # NOTE: Inline fallback — only runs before ARQ worker (Task 15) has pre-computed scores.
        # WARNING: Must be replaced by background ARQ scoring before beta launch.
        rows = await _compute_scores(current_user, db)

    candidate_ids = [r.candidate_id for r in rows]
    users_result = await db.execute(select(User).where(User.id.in_(candidate_ids)))
    users_map = {u.id: u for u in users_result.scalars()}

    return [
        {
            "candidate_id": r.candidate_id,
            "score": round(r.score * 100),
            "highlights": r.highlights,
            "age": users_map[r.candidate_id].age,
            "city": users_map[r.candidate_id].city,
            "gender": users_map[r.candidate_id].gender,
            "personality_tags": users_map[r.candidate_id].personality_tags,
        }
        for r in rows
        if r.candidate_id in users_map
    ]


async def _compute_scores(user: User, db: AsyncSession) -> list[UserCandidate]:
    """Inline scoring for MVP. Evaluates max 50 candidates, returns top 20."""
    approached = select(Approach.receiver_id).where(Approach.initiator_id == user.id)
    candidates_q = await db.execute(
        select(User)
        .where(User.id != user.id)
        .where(User.visibility == "active")
        .where(User.deleted_at.is_(None))
        .where(not_(User.id.in_(approached)))
        .limit(50)
    )
    candidates = candidates_q.scalars().all()

    req_text = requirements_to_text(user)
    results: list[UserCandidate] = []
    for c in candidates:
        score = await score_candidate(req_text, profile_to_text(c))
        highlights = build_highlights(
            {"city": user.city, "personality_tags": user.personality_tags or []},
            {"city": c.city, "life_goals": c.life_goals, "personality_tags": c.personality_tags or []},
        )
        uc = UserCandidate(
            user_id=user.id, candidate_id=c.id, score=score, highlights=highlights
        )
        db.add(uc)
        results.append(uc)
    await db.commit()
    return sorted(results, key=lambda x: x.score, reverse=True)[:20]
