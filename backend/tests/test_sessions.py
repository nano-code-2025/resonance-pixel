import pytest
from unittest.mock import AsyncMock, patch


def test_mark_question_completed_accumulates():
    """mark_question_completed adds question to state and increments index."""
    import asyncio

    async def run():
        initial_state = {"current_question_index": 0, "questions_completed": []}
        with patch("services.session_guide.get_session_state", AsyncMock(return_value=initial_state)), \
             patch("services.session_guide.set_session_state", AsyncMock()):
            from services.session_guide import mark_question_completed
            state = await mark_question_completed("sess-1", 1)
            assert 1 in state["questions_completed"]
            assert state["current_question_index"] >= 1

    asyncio.run(run())


def test_initial_session_state():
    """get_session_state returns default when key not in Redis."""
    import asyncio

    async def run():
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)
        with patch("services.session_guide.get_redis", AsyncMock(return_value=mock_redis)):
            from services.session_guide import get_session_state
            state = await get_session_state("nonexistent")
            assert state["current_question_index"] == 0
            assert state["questions_completed"] == []

    asyncio.run(run())
