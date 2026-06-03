# -*- coding: utf-8 -*-
"""Approach API: draft, send, respond, rate."""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from app_config import settings
from db.models import Approach, Match, User
from db.session import get_db
from services.approach_writer import draft_approach_message
from services.payment_service import charge_approach
from services.pool_curator import profile_to_text

router = APIRouter()


class DraftRequest(BaseModel):
    candidate_id: str
    tier: str = "standard"


class SendApproachRequest(BaseModel):
    candidate_id: str
    tier: str = "standard"
    confirmed_message: str


class RespondRequest(BaseModel):
    response: str  # "accepted" | "declined"


class RateRequest(BaseModel):
    rating: str  # "good" | "bad"


@router.get("/received")
async def get_received_approaches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List pending approaches received by the current user."""
    result = await db.execute(
        select(Approach, User)
        .join(User, User.id == Approach.initiator_id)
        .where(Approach.receiver_id == current_user.id)
        .where(Approach.status == "pending")
        .order_by(Approach.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "approach_id": a.id,
            "ai_message": a.ai_message,
            "tier": a.tier,
            "created_at": a.created_at.isoformat(),
            "initiator": {
                "user_id": u.id,
                "age": u.age,
                "city": u.city,
                "gender": u.gender,
                "personality_tags": u.personality_tags,
                "selfie_url": u.selfie_url,
            },
        }
        for a, u in rows
    ]


@router.get("/sent")
async def get_sent_approaches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List approaches sent by the current user and their status."""
    result = await db.execute(
        select(Approach)
        .where(Approach.initiator_id == current_user.id)
        .order_by(Approach.created_at.desc())
        .limit(20)
    )
    approaches = result.scalars().all()
    return [
        {
            "approach_id": a.id,
            "tier": a.tier,
            "status": a.status,
            "created_at": a.created_at.isoformat(),
        }
        for a in approaches
    ]


@router.post("/draft")
async def draft_approach(
    req_body: DraftRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Draft an AI message. Does NOT persist yet — user must confirm."""
    await _check_rate_limit(current_user.id, db)
    candidate = await db.get(User, req_body.candidate_id)
    if not candidate or candidate.deleted_at:
        raise HTTPException(404, "Candidate not found")
    msg = await draft_approach_message(
        profile_to_text(current_user), profile_to_text(candidate), req_body.tier
    )
    return {"ai_message": msg, "candidate_id": req_body.candidate_id, "tier": req_body.tier}


@router.post("/send")
async def send_approach(
    req_body: SendApproachRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Persist Approach after user confirms the drafted message. Charges via payment stub."""
    await _check_rate_limit(current_user.id, db)
    candidate = await db.get(User, req_body.candidate_id)
    if not candidate or candidate.deleted_at:
        raise HTTPException(404, "Candidate not found")
    try:
        payment_id = await charge_approach(current_user.id, req_body.tier)
    except RuntimeError as e:
        raise HTTPException(402, f"Payment failed: {e}")
    approach = Approach(
        initiator_id=current_user.id,
        receiver_id=req_body.candidate_id,
        tier=req_body.tier,
        ai_message=req_body.confirmed_message[:150],
        status="pending",
        payment_id=payment_id,
    )
    db.add(approach)
    await db.commit()
    await db.refresh(approach)
    return {"approach_id": approach.id, "status": "pending"}


@router.patch("/{approach_id}/respond")
async def respond_to_approach(
    approach_id: str,
    req_body: RespondRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Receiver responds to an approach (accept or decline)."""
    approach = await db.get(Approach, approach_id)
    if not approach or approach.receiver_id != current_user.id:
        raise HTTPException(404, "Approach not found")
    if approach.status != "pending":
        raise HTTPException(400, "Approach already responded")
    approach.status = req_body.response
    approach.responded_at = datetime.now(timezone.utc)
    if req_body.response == "accepted":
        match = Match(
            user_a_id=approach.initiator_id,
            user_b_id=approach.receiver_id,
            approach_id=approach.id,
        )
        db.add(match)
    await db.commit()
    return {"status": req_body.response}


@router.patch("/{approach_id}/rate")
async def rate_approach_quality(
    approach_id: str,
    req_body: RateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rate the quality of an approach message (good/bad)."""
    approach = await db.get(Approach, approach_id)
    if not approach or approach.receiver_id != current_user.id:
        raise HTTPException(404, "Approach not found")
    approach.quality_rating = req_body.rating
    await db.commit()
    return {"ok": True}


async def _check_rate_limit(user_id: str, db: AsyncSession) -> None:
    """Check weekly limit and cooldown period."""
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    count_result = await db.execute(
        select(func.count())
        .select_from(Approach)
        .where(Approach.initiator_id == user_id)
        .where(Approach.created_at > week_ago)
    )
    count = count_result.scalar()
    if count >= settings.approach_weekly_limit:
        raise HTTPException(
            429, f"Weekly approach limit ({settings.approach_weekly_limit}) reached"
        )
    # Cooldown check
    last_result = await db.execute(
        select(Approach)
        .where(Approach.initiator_id == user_id)
        .order_by(Approach.created_at.desc())
        .limit(1)
    )
    last_approach = last_result.scalar_one_or_none()
    if last_approach and last_approach.created_at:
        last_ts = last_approach.created_at
        # Handle naive datetimes from DB
        if last_ts.tzinfo is None:
            last_ts = last_ts.replace(tzinfo=timezone.utc)
        hours_since = (datetime.now(timezone.utc) - last_ts).total_seconds() / 3600
        if hours_since < settings.approach_cooldown_hours:
            remaining = settings.approach_cooldown_hours - hours_since
            raise HTTPException(429, f"Cooldown: {remaining:.1f}h remaining")
