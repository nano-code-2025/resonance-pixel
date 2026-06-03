import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.mark.asyncio
async def test_draft_message_is_short():
    """draft_approach_message returns string within tier length limit."""
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="很高兴认识你，听说你也喜欢爬山，有机会一起去？")]

    with patch("services.approach_writer.anthropic_client") as mock_client:
        mock_client.messages.create = AsyncMock(return_value=mock_response)
        from services.approach_writer import draft_approach_message
        msg = await draft_approach_message("喜欢爬山的工程师", "也喜欢户外，成都人", "standard")
        assert isinstance(msg, str)
        assert len(msg) <= 150


def test_tier_instructions_cover_all_tiers():
    """All tier names have instructions defined."""
    from services.approach_writer import TIER_INSTRUCTIONS
    for tier in ("standard", "personalized", "premium"):
        assert tier in TIER_INSTRUCTIONS
