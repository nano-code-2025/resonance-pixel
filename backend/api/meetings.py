"""Meeting scheduling API — Feishu video call for Round 1."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_

from api.auth import get_current_user
from db.models import Match, User
from db.models import Session as DBSession
from db.session import get_db
from services.feishu_service import create_meeting

router = APIRouter()


class ScheduleRequest(BaseModel):
    match_id: str
    start_time: datetime  # ISO 8601


@router.post("/schedule")
async def schedule_meeting(
    body: ScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Schedule a Feishu video call for a match. Creates a Session if none exists."""
    match = await db.get(Match, body.match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403, "Not your match")
    if match.status not in ("active",):
        raise HTTPException(400, "Match is not active")

    # Check for existing session in this round
    result = await db.execute(
        select(DBSession).where(
            DBSession.match_id == match.id,
            DBSession.round_number == match.current_round,
        )
    )
    session = result.scalar_one_or_none()

    # Create Feishu meeting
    topic = f"Resonance · 第{match.current_round}轮"
    try:
        meeting = await create_meeting(topic, body.start_time, duration_minutes=60)
    except RuntimeError as e:
        raise HTTPException(503, f"视频房间创建失败: {e}")

    if session:
        session.feishu_meeting_url = meeting.url
        session.scheduled_at = body.start_time
    else:
        session = DBSession(
            match_id=match.id,
            round_number=match.current_round,
            type="feishu_call",
            host_user_id=match.user_a_id,
            scheduled_at=body.start_time,
            feishu_meeting_url=meeting.url,
        )
        db.add(session)

    await db.commit()
    await db.refresh(session)

    return {
        "session_id": session.id,
        "meeting_url": meeting.url,
        "scheduled_at": body.start_time.isoformat(),
    }
