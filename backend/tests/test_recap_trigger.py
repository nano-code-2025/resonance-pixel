import asyncio
from unittest.mock import AsyncMock, MagicMock, patch


def test_generate_recap_from_answers():
    """generate_recap_from_answers uses actual answer texts."""
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="你们聊了关于完美一天的想象。")]

    async def run():
        with patch("services.recap_generator.anthropic_client") as mock_client:
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            from services.recap_generator import generate_recap_from_answers
            answers = [
                {"question_text": "你觉得完美的一天是什么样的？", "answer_a": "在家看书", "answer_b": "去菜市场"},
            ]
            result = await generate_recap_from_answers(answers, round_number=1)
            assert isinstance(result, str)
            assert len(result) > 0
            # Verify the prompt includes actual answers
            call_args = mock_client.messages.create.call_args
            prompt_text = call_args.kwargs["messages"][0]["content"]
            assert "在家看书" in prompt_text
            assert "去菜市场" in prompt_text

    asyncio.run(run())


def test_generate_recap_from_answers_empty():
    """Empty answers list returns default message."""
    async def run():
        from services.recap_generator import generate_recap_from_answers
        result = await generate_recap_from_answers([], round_number=1)
        assert isinstance(result, str)
        assert len(result) > 0

    asyncio.run(run())
