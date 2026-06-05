import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_get_recap(client, seed_session, auth_headers, db):
    """GET /sessions/{id}/recap returns the AI recap."""
    seed_session.ai_recap = "今天你们聊了关于完美一天的话题。"
    await db.commit()

    mock_state = {"current_question_index": 0, "questions_completed": []}
    with patch("api.sessions.get_session_state", AsyncMock(return_value=mock_state)):
        resp = await client.get(
            f"/api/sessions/{seed_session.id}/recap",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["recap"] == "今天你们聊了关于完美一天的话题。"


@pytest.mark.asyncio
async def test_get_recap_not_generated(client, seed_session, auth_headers):
    """GET /sessions/{id}/recap returns null when recap not yet generated."""
    mock_state = {"current_question_index": 0, "questions_completed": []}
    with patch("api.sessions.get_session_state", AsyncMock(return_value=mock_state)):
        resp = await client.get(
            f"/api/sessions/{seed_session.id}/recap",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["recap"] is None
