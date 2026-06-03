"""
Feishu MeetingService — creates video meeting rooms with guest join links.

When FEISHU_APP_ID is not configured, falls back to a stub that returns
a fake meeting URL so scheduling flow still works in dev.

Feishu video meetings support guest join via browser link without a Feishu account.
"""
import logging
from datetime import datetime, timezone
from dataclasses import dataclass

import httpx

from app_config import settings

logger = logging.getLogger(__name__)

_token_cache: dict[str, str] = {}  # simple in-memory cache


@dataclass
class MeetingResult:
    url: str
    meeting_id: str


def _is_configured() -> bool:
    return bool(settings.feishu_app_id and settings.feishu_app_secret)


async def _get_tenant_token() -> str:
    """Get or refresh tenant_access_token from Feishu."""
    cached = _token_cache.get("token")
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
            json={
                "app_id": settings.feishu_app_id,
                "app_secret": settings.feishu_app_secret,
            },
        )
        data = resp.json()
        if data.get("code") != 0:
            raise RuntimeError(f"Feishu auth failed: {data.get('msg')}")
        token = data["tenant_access_token"]
        _token_cache["token"] = token
        return token


async def create_meeting(
    topic: str,
    start_time: datetime,
    duration_minutes: int = 60,
) -> MeetingResult:
    """
    Create a Feishu video meeting with guest link.

    Returns MeetingResult with the join URL that works without a Feishu account.
    Falls back to stub when credentials are absent.
    """
    if not _is_configured():
        import uuid
        fake_id = uuid.uuid4().hex[:12]
        fake_url = f"https://meetings.feishu.cn/stub/{fake_id}"
        logger.warning(
            "[FEISHU-STUB] Would create meeting '%s' at %s → %s",
            topic, start_time.isoformat(), fake_url,
        )
        return MeetingResult(url=fake_url, meeting_id=fake_id)

    try:
        token = await _get_tenant_token()
        start_ts = str(int(start_time.timestamp()))
        end_ts = str(int(start_time.timestamp()) + duration_minutes * 60)

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://open.feishu.cn/open-apis/vc/v1/reserves",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "end_time": end_ts,
                    "meeting_settings": {
                        "topic": topic,
                        "action_permissions": [
                            {"permission": 1, "permission_checkers": {"check_list": [{"check_field": 1, "check_mode": 1, "check_list": ["*"]}]}}
                        ],
                        "join_meeting_permission": 1,
                    },
                },
            )
            data = resp.json()
            if data.get("code") != 0:
                _token_cache.clear()
                raise RuntimeError(f"Feishu meeting create failed: {data.get('msg')}")

            reserve = data.get("data", {}).get("reserve", {})
            meeting_url = reserve.get("live_link") or reserve.get("meeting_url", "")
            meeting_id = str(reserve.get("id", ""))

            logger.info("Created Feishu meeting: %s → %s", topic, meeting_url)
            return MeetingResult(url=meeting_url, meeting_id=meeting_id)

    except httpx.HTTPError as e:
        logger.error("Feishu HTTP error: %s", e)
        raise RuntimeError("Video meeting service unavailable") from e
