"""Offer API — send relationship offers, respond to incoming offers."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from db.models import Match, Offer, User
from db.session import get_db
from models.schemas import OfferRespondRequest

router = APIRouter()


class SendOfferRequest(BaseModel):
    match_id: str


@router.post("")
async def send_offer(
    body: SendOfferRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    match = await db.get(Match, body.match_id)
    if not match or match.status not in ("active",):
        raise HTTPException(400, "Match not available for offer")
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    # Check for existing offer
    existing_result = await db.execute(select(Offer).where(Offer.match_id == body.match_id))
    existing_offer = existing_result.scalar_one_or_none()
    if existing_offer and existing_offer.sender_id != current_user.id:
        # Other party already sent offer → auto-confirm (first-writer-wins)
        existing_offer.status = "accepted"
        existing_offer.responded_at = datetime.now(timezone.utc)
        match.status = "confirmed"
        await db.commit()
        return {"status": "confirmed", "message": "在一起！双方都想认真了。"}
    if existing_offer:
        raise HTTPException(409, "Offer already sent")
    offer = Offer(match_id=body.match_id, sender_id=current_user.id)
    match.status = "offer_pending"
    db.add(offer)
    await db.commit()
    await db.refresh(offer)
    return {"offer_id": offer.id, "status": "pending"}


@router.patch("/{offer_id}/respond")
async def respond_to_offer(
    offer_id: str,
    body: OfferRespondRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offer = await db.get(Offer, offer_id)
    if not offer:
        raise HTTPException(404)
    match = await db.get(Match, offer.match_id)
    # Receiver can respond (not the sender)
    if current_user.id not in (match.user_a_id, match.user_b_id) or current_user.id == offer.sender_id:
        raise HTTPException(403)
    offer.status = body.response
    offer.responded_at = datetime.now(timezone.utc)
    if body.response == "accepted":
        match.status = "confirmed"
    elif body.response == "declined":
        match.status = "closed"
    await db.commit()
    return {"status": body.response}
