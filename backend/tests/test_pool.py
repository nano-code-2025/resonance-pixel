import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.mark.asyncio
async def test_score_candidate_returns_float():
    """score_candidate parses float from Claude response."""
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="0.78")]

    with patch("services.pool_curator.anthropic_client") as mock_client:
        mock_client.messages.create = AsyncMock(return_value=mock_response)
        from services.pool_curator import score_candidate
        score = await score_candidate("想找踏实的人", "爱阅读、成都")
        assert 0.0 <= score <= 1.0


def test_highlights_are_three_strings():
    """build_highlights always returns exactly 3 strings."""
    from services.pool_curator import build_highlights
    h = build_highlights(
        {"city": "成都", "personality_tags": ["内向"]},
        {"city": "成都", "life_goals": "寻找真实连接", "personality_tags": ["爱阅读"]},
    )
    assert len(h) == 3
    assert all(isinstance(s, str) for s in h)


def test_highlights_fallback_when_sparse():
    """build_highlights fills to 3 even with empty input."""
    from services.pool_curator import build_highlights
    h = build_highlights({}, {})
    assert len(h) == 3


def test_profile_to_text_returns_string():
    """profile_to_text converts User fields to readable string."""
    from services.pool_curator import profile_to_text
    from db.models import User
    u = User(life_goals="旅行", personality_tags=["好奇"], city="成都", work="工程师")
    text = profile_to_text(u)
    assert "旅行" in text
    assert "成都" in text
