import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_session_state_includes_answer_count(
    client, seed_session, seed_user, seed_match, auth_headers, db
):
    """GET /sessions/{id}/state should include questions_answered_count."""
    from db.models import QuestionAnswer
    # Add 2 answers from current user
    for qid in [1, 2]:
        a = QuestionAnswer(
            session_id=seed_session.id,
            user_id=seed_user.id,
            question_id=qid,
            answer_text=f"Answer for q{qid}",
        )
        db.add(a)
    await db.commit()

    mock_state = {"current_question_index": 0, "questions_completed": []}
    with patch(
        "api.sessions.get_session_state",
        AsyncMock(return_value=mock_state),
    ):
        resp = await client.get(
            f"/api/sessions/{seed_session.id}/state",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "questions_answered_count" in data
    assert data["questions_answered_count"] == 2
