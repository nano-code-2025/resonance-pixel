"""Match setup endpoints: format vote and availability for scheduling."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from db.models import Match, User
from db.session import get_db

router = APIRouter()


class FormatVoteRequest(BaseModel):
    preference: str  # "video" | "in_person" | "either"


class AvailabilityRequest(BaseModel):
    slots: list[dict]  # [{"start": "ISO", "end": "ISO"}]


def _resolve_format(vote_a: str | None, vote_b: str | None) -> str | None:
    """Resolve session format from two votes. Returns None if one hasn't voted."""
    if not vote_a or not vote_b:
        return None
    if vote_a == vote_b:
        return "feishu_call" if vote_a == "video" else ("in_person" if vote_a == "in_person" else "feishu_call")
    if vote_a == "either":
        return "feishu_call" if vote_b == "video" else "in_person"
    if vote_b == "either":
        return "feishu_call" if vote_a == "video" else "in_person"
    # Conflict: one wants video, other wants in_person → default in_person (lower barrier)
    return "in_person"


def _find_overlap(slots_a: list[dict], slots_b: list[dict]) -> dict | None:
    """Find first overlapping time slot between two sets."""
    from datetime import datetime as dt
    for sa in (slots_a or []):
        for sb in (slots_b or []):
            a_start = dt.fromisoformat(sa["start"])
            a_end = dt.fromisoformat(sa["end"])
            b_start = dt.fromisoformat(sb["start"])
            b_end = dt.fromisoformat(sb["end"])
            overlap_start = max(a_start, b_start)
            overlap_end = min(a_end, b_end)
            if overlap_start < overlap_end:
                return {"start": overlap_start.isoformat(), "end": overlap_end.isoformat()}
    return None


@router.post("/{match_id}/vote")
async def vote_format(
    match_id: str,
    req: FormatVoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.preference not in ("video", "in_person", "either"):
        raise HTTPException(400, "preference must be video, in_person, or either")
    match = await db.get(Match, match_id)
    if not match or match.status != "active":
        raise HTTPException(404, "Match not found or not active")
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    is_a = current_user.id == match.user_a_id
    if is_a:
        match.format_vote_a = req.preference
    else:
        match.format_vote_b = req.preference
    await db.commit()
    resolved = _resolve_format(match.format_vote_a, match.format_vote_b)
    return {
        "my_vote": req.preference,
        "both_voted": resolved is not None,
        "resolved_format": resolved,
    }


@router.post("/{match_id}/availability")
async def submit_availability(
    match_id: str,
    req: AvailabilityRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if len(req.slots) > 5:
        raise HTTPException(400, "Max 5 slots")
    match = await db.get(Match, match_id)
    if not match or match.status != "active":
        raise HTTPException(404)
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    is_a = current_user.id == match.user_a_id
    if is_a:
        match.availability_a = [s for s in req.slots]
    else:
        match.availability_b = [s for s in req.slots]
    await db.commit()

    # Check for overlap if both submitted
    overlap = None
    if match.availability_a and match.availability_b:
        overlap = _find_overlap(match.availability_a, match.availability_b)
        if overlap:
            from datetime import datetime as dt
            match.scheduled_at = dt.fromisoformat(overlap["start"])
            await db.commit()

    return {
        "submitted": True,
        "both_submitted": match.availability_a is not None and match.availability_b is not None,
        "overlap": overlap,
        "scheduled_at": match.scheduled_at.isoformat() if match.scheduled_at else None,
    }


@router.get("/{match_id}/setup-status")
async def get_setup_status(
    match_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    match = await db.get(Match, match_id)
    if not match:
        raise HTTPException(404)
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    is_a = current_user.id == match.user_a_id
    resolved = _resolve_format(match.format_vote_a, match.format_vote_b)
    return {
        "my_vote": match.format_vote_a if is_a else match.format_vote_b,
        "other_voted": (match.format_vote_b if is_a else match.format_vote_a) is not None,
        "resolved_format": resolved,
        "my_availability": match.availability_a if is_a else match.availability_b,
        "other_availability_submitted": (match.availability_b if is_a else match.availability_a) is not None,
        "scheduled_at": match.scheduled_at.isoformat() if match.scheduled_at else None,
    }
