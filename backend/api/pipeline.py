"""Pipeline view — two-stream: pursuing (I initiated) vs being_found (they initiated)."""

from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from db.models import Match
from db.models import Session as DBSession  # noqa: avoid shadowing AsyncSession
from db.models import User
from db.session import get_db

router = APIRouter()


@router.get("")
async def get_pipeline(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Match)
        .where(
            or_(
                Match.user_a_id == current_user.id,
                Match.user_b_id == current_user.id,
            )
        )
        .where(Match.status.in_(["active", "offer_pending", "confirmed"]))
        .order_by(Match.created_at.desc())
    )
    matches = result.scalars().all()

    pursuing: list[dict] = []
    being_found: list[dict] = []

    for m in matches:
        is_initiator = m.user_a_id == current_user.id  # user_a = approach initiator
        other_id = m.user_b_id if is_initiator else m.user_a_id
        other = await db.get(User, other_id)
        entry = {
            "match_id": m.id,
            "round": m.current_round,
            "status": m.status,
            "other_city": other.city if other else None,
            "other_gender": other.gender if other else None,
            "other_personality_tags": other.personality_tags if other else [],
        }
        (pursuing if is_initiator else being_found).append(entry)

    return {"pursuing": pursuing, "being_found": being_found}
