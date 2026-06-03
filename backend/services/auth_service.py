import random
import string
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError

from app_config import settings


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.jwt_secret,
        algorithm="HS256",
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError:
        raise ValueError("Invalid token")
