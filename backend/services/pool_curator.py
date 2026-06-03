"""Pool curation: AI scoring + highlight generation for candidate matching."""

import anthropic
from app_config import settings
from db.models import User

anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


async def score_candidate(requirements_text: str, candidate_profile_text: str) -> float:
    """Score how well a candidate matches requirements using Claude Haiku. Returns 0.0–1.0."""
    prompt = (
        f"Rate how well this candidate matches the requirements.\n"
        f"Requirements: {requirements_text}\n"
        f"Candidate: {candidate_profile_text}\n"
        f"Reply with ONLY a decimal number between 0.0 and 1.0. Nothing else."
    )
    resp = await anthropic_client.messages.create(
        model=settings.haiku_model,
        max_tokens=10,
        messages=[{"role": "user", "content": prompt}],
    )
    try:
        return min(1.0, max(0.0, float(resp.content[0].text.strip())))
    except (ValueError, IndexError):
        return 0.5


def build_highlights(user_profile: dict, candidate_profile: dict) -> list[str]:
    """Generate exactly 3 highlight strings explaining candidate fit. Rule-based for MVP."""
    highlights: list[str] = []
    if user_profile.get("city") and user_profile.get("city") == candidate_profile.get("city"):
        highlights.append(f"同在{candidate_profile['city']}")
    if candidate_profile.get("life_goals"):
        highlights.append(f"TA的目标：{candidate_profile['life_goals'][:30]}")
    tags = candidate_profile.get("personality_tags") or []
    if tags:
        highlights.append(f"性格标签：{'、'.join(tags[:2])}")
    while len(highlights) < 3:
        highlights.append("画像契合度较高")
    return highlights[:3]


def profile_to_text(user: User) -> str:
    """Convert User fields to a concise text description for the AI prompt."""
    parts: list[str] = []
    if user.life_goals:
        parts.append(f"人生目标：{user.life_goals}")
    if user.personality_tags:
        parts.append(f"性格：{'、'.join(user.personality_tags)}")
    if user.city:
        parts.append(f"城市：{user.city}")
    if user.work:
        parts.append(f"工作：{user.work}")
    return "；".join(parts) or "暂无详细信息"


def requirements_to_text(user: User) -> str:
    """Convert User.requirements dict to a readable requirements description."""
    req = user.requirements or {}
    parts: list[str] = []
    if req.get("preferences"):
        parts.append("偏好：" + "、".join(req["preferences"]))
    if req.get("dealbreakers"):
        parts.append("不接受：" + "、".join(req["dealbreakers"]))
    return "；".join(parts) or "无特定要求"
