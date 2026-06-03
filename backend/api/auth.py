from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as aioredis

from db.session import get_db
from db.models import User
from services.auth_service import generate_otp, create_token
from app_config import settings

router = APIRouter()


async def get_redis():
    r = aioredis.from_url(settings.redis_url)
    try:
        yield r
    finally:
        await r.aclose()


class OtpSendRequest(BaseModel):
    phone: str


class OtpVerifyRequest(BaseModel):
    phone: str
    otp: str


@router.post("/send-otp")
async def send_otp(body: OtpSendRequest, r=Depends(get_redis)):
    phone = body.phone
    # Rate limit: max 5 OTPs per phone per hour
    key = f"otp_rate:{phone}"
    count = await r.incr(key)
    if count == 1:
        await r.expire(key, 3600)
    if count > 5:
        raise HTTPException(429, "Too many OTP requests")
    otp = generate_otp()
    await r.setex(f"otp:{phone}", settings.otp_ttl_seconds, otp)
    # MVP: log OTP instead of SMS (replace with 腾讯云短信 in production)
    print(f"[OTP] {phone}: {otp}")
    return {"message": "OTP sent"}


@router.post("/verify")
async def verify_otp(
    body: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    phone, otp = body.phone, body.otp
    stored = await r.get(f"otp:{phone}")
    if not stored or stored.decode() != otp:
        raise HTTPException(400, "Invalid or expired OTP")
    await r.delete(f"otp:{phone}")
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    if not user:
        user = User(phone=phone)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    token = create_token(user.id)
    return {"token": token, "user_id": user.id, "is_new": user.age is None}
