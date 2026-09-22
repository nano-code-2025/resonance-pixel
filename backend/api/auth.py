from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as aioredis
import logging

from db.session import get_db
from db.models import User
from services.auth_service import generate_otp, create_token, decode_token
from services.sms_service import send_otp_sms
from app_config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

_security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise HTTPException(401, "Invalid token")
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or user.deleted_at:
        raise HTTPException(401, "User not found")
    return user


class _InMemoryRedis:
    """Minimal Redis-like stub for local dev when Redis is unavailable."""
    def __init__(self):
        self._store: dict[str, tuple[str, float | None]] = {}

    async def incr(self, key: str) -> int:
        import time
        val, exp = self._store.get(key, ("0", None))
        if exp and time.time() > exp:
            val = "0"
        new_val = str(int(val) + 1)
        self._store[key] = (new_val, exp)
        return int(new_val)

    async def expire(self, key: str, seconds: int):
        import time
        val, _ = self._store.get(key, ("0", None))
        self._store[key] = (val, time.time() + seconds)

    async def setex(self, key: str, seconds: int, value: str):
        import time
        self._store[key] = (str(value), time.time() + seconds)

    async def get(self, key: str) -> bytes | None:
        import time
        item = self._store.get(key)
        if not item:
            return None
        val, exp = item
        if exp and time.time() > exp:
            del self._store[key]
            return None
        return val.encode()

    async def delete(self, key: str):
        self._store.pop(key, None)

    async def aclose(self):
        pass

_fallback_redis = _InMemoryRedis()


async def get_redis():
    try:
        r = aioredis.from_url(settings.redis_url)
        await r.ping()
        try:
            yield r
        finally:
            await r.aclose()
    except (ConnectionError, OSError, Exception) as e:
        logger.warning("[DEV] Redis unavailable (%s), using in-memory stub", e)
        yield _fallback_redis


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
    try:
        await send_otp_sms(phone, otp)
    except RuntimeError as e:
        raise HTTPException(503, f"SMS service error: {e}")
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
