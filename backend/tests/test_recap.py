import asyncio
from unittest.mock import AsyncMock, MagicMock, patch


def test_generate_recap_returns_string():
    """generate_recap produces a non-empty string."""
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="今天的对话很深刻，下次可以从Q13继续。")]

    async def run():
        with patch("services.recap_generator.anthropic_client") as mock_client:
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            from services.recap_generator import generate_recap
            result = await generate_recap([1, 2, 3], 1)
            assert isinstance(result, str)
            assert len(result) > 0

    asyncio.run(run())


def test_generate_recap_empty_questions():
    """generate_recap handles empty question list gracefully."""
    async def run():
        from services.recap_generator import generate_recap
        # No mock needed — falls back before API call
        result = await generate_recap([], 1)
        assert isinstance(result, str)
        assert len(result) > 0

    asyncio.run(run())


def test_worker_settings_has_functions():
    """WorkerSettings defines at least one worker function."""
    from workers.arq_worker import WorkerSettings
    assert len(WorkerSettings.functions) >= 2
    func_names = [f.__name__ for f in WorkerSettings.functions]
    assert "compute_pool_scores" in func_names
    assert "nightly_recap_batch" in func_names
