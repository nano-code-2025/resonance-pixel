"""Session guide: Redis-backed state for real-time question progress."""

import json

import redis.asyncio as aioredis

from app_config import settings


async def get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.redis_url)


async def get_session_state(session_id: str) -> dict:
    r = await get_redis()
    key = f"session:{session_id}:state"
    data = await r.get(key)
    if data:
        return json.loads(data)
    return {"current_question_index": 0, "questions_completed": []}


async def set_session_state(session_id: str, state: dict, ttl: int = 86400) -> None:
    r = await get_redis()
    key = f"session:{session_id}:state"
    await r.setex(key, ttl, json.dumps(state))


async def mark_question_completed(session_id: str, question_id: int) -> dict:
    state = await get_session_state(session_id)
    if question_id not in state["questions_completed"]:
        state["questions_completed"].append(question_id)
    state["current_question_index"] = max(
        state.get("current_question_index", 0),
        len(state["questions_completed"]),
    )
    await set_session_state(session_id, state)
    return state
