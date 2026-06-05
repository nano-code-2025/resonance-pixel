# UI Optimization Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend API changes that support the UI optimization spec (bloom_stage, questions_answered_count, recap generation, compatibility_bucket).

**Architecture:** Incremental additions to existing FastAPI endpoints + one new endpoint. No new tables needed — User gets a `preferences` JSON column, and bloom_stage is computed on the fly from existing Match/Session data. Recap generation hooks into the existing end_session flow.

**Tech Stack:** FastAPI, SQLAlchemy async, PostgreSQL, Alembic migrations, pytest, Claude API (Haiku for recaps)

---

### Task 1: Add `bloom_stage` to Pipeline Response

**Files:**
- Create: `backend/services/bloom_stage.py`
- Modify: `backend/api/pipeline.py:39-68`
- Create: `backend/tests/test_bloom_stage.py`

- [ ] **Step 1: Write the failing test for bloom_stage computation**

```python
# backend/tests/test_bloom_stage.py
from unittest.mock import MagicMock


def test_stage_0_no_session():
    """Stage 0 (seed): match exists but no session started."""
    from services.bloom_stage import compute_bloom_stage
    match = MagicMock(current_round=1, status="active")
    assert compute_bloom_stage(match, current_session=None) == 0


def test_stage_1_session_in_progress():
    """Stage 1 (sprout): round 1 session exists but not completed."""
    from services.bloom_stage import compute_bloom_stage
    match = MagicMock(current_round=1, status="active")
    session = MagicMock(completed_at=None)
    assert compute_bloom_stage(match, current_session=session) == 1


def test_stage_2_round1_completed():
    """Stage 2 (growth): round 1 completed, now in round 2."""
    from services.bloom_stage import compute_bloom_stage
    match = MagicMock(current_round=2, status="active")
    assert compute_bloom_stage(match, current_session=None) == 2


def test_stage_3_round2_completed():
    """Stage 3 (bloom): round 2 completed, now in round 3."""
    from services.bloom_stage import compute_bloom_stage
    match = MagicMock(current_round=3, status="active")
    assert compute_bloom_stage(match, current_session=None) == 3


def test_stage_4_confirmed():
    """Stage 4 (full bloom): match confirmed."""
    from services.bloom_stage import compute_bloom_stage
    match = MagicMock(current_round=3, status="confirmed")
    assert compute_bloom_stage(match, current_session=None) == 4


def test_stage_2_round1_session_just_completed():
    """Stage 2: round 1 still current but session completed (before round advances)."""
    from services.bloom_stage import compute_bloom_stage
    match = MagicMock(current_round=1, status="active")
    session = MagicMock(completed_at="2026-06-05T00:00:00Z")
    assert compute_bloom_stage(match, current_session=session) == 2
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_bloom_stage.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'services.bloom_stage'`

- [ ] **Step 3: Implement bloom_stage computation**

```python
# backend/services/bloom_stage.py
"""Compute bloom growth stage from match + session state.

Maps to UI spec Section 5.2.3:
  stage 0 = seed (just matched, no session yet)
  stage 1 = sprout (round 1 in progress)
  stage 2 = growth (round 1 completed)
  stage 3 = bloom (round 2 completed)
  stage 4 = full bloom (round 3 completed or confirmed)
"""

from db.models import Match
from db.models import Session as DBSession


def compute_bloom_stage(match: Match, current_session: DBSession | None) -> int:
    if match.status == "confirmed":
        return 4

    completed_rounds = match.current_round - 1  # rounds fully done

    # If current session is completed, that round is done too
    if current_session and current_session.completed_at:
        completed_rounds += 1

    if completed_rounds == 0 and not current_session:
        return 0  # seed: no session at all

    if completed_rounds == 0:
        return 1  # sprout: session in progress but round not done

    return min(completed_rounds + 1, 4)  # growth(2), bloom(3), full bloom(4)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_bloom_stage.py -v`
Expected: All 6 tests PASS

- [ ] **Step 5: Add bloom_stage to pipeline response**

In `backend/api/pipeline.py`, after line 55 (`q_completed = ...`), add:

```python
from services.bloom_stage import compute_bloom_stage
```

(at top of file, with other imports)

And in the entry dict (after `"questions_completed": q_completed,`), add:

```python
"bloom_stage": compute_bloom_stage(m, latest_session),
```

- [ ] **Step 6: Commit**

```bash
git add backend/services/bloom_stage.py backend/tests/test_bloom_stage.py backend/api/pipeline.py
git commit -m "feat: add bloom_stage computation to pipeline response

Computes 5-stage bloom growth (seed/sprout/growth/bloom/full-bloom) from
match round + session state. Added to GET /api/pipeline response.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Add `questions_answered_count` to Session State

**Files:**
- Modify: `backend/api/sessions.py:97-133`
- Create: `backend/tests/test_session_answer_count.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_session_answer_count.py
import pytest


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

    resp = await client.get(
        f"/api/sessions/{seed_session.id}/state",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "questions_answered_count" in data
    assert data["questions_answered_count"] == 2
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_session_answer_count.py -v`
Expected: FAIL — `questions_answered_count` not in response

- [ ] **Step 3: Add questions_answered_count to session state endpoint**

In `backend/api/sessions.py`, add `QuestionAnswer` to imports (line 14 area) and `func` from sqlalchemy:

```python
from sqlalchemy import select, func
```

Then in the `get_state` endpoint, before the return statement (around line 120), add:

```python
    # Count this user's answers for progressive photo unlock
    answer_count_result = await db.execute(
        select(func.count())
        .where(QuestionAnswer.session_id == session_id)
        .where(QuestionAnswer.user_id == current_user.id)
    )
    questions_answered_count = answer_count_result.scalar() or 0
```

And add to the return dict:

```python
        "questions_answered_count": questions_answered_count,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_session_answer_count.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/api/sessions.py backend/tests/test_session_answer_count.py
git commit -m "feat: add questions_answered_count to session state

Counts current user's answers in the session. Used by frontend for
progressive photo unlock (Level 2 triggers at 3 answers).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Hook Recap Generation into Session End

**Files:**
- Modify: `backend/api/sessions.py:287-321` (end_session endpoint)
- Modify: `backend/services/recap_generator.py`
- Create: `backend/tests/test_recap_trigger.py`

The existing `generate_recap` only takes `questions_completed` and `round_number`. The spec wants recaps based on both users' actual answers. We add a new `generate_recap_from_answers` that uses Haiku (cheaper, faster) instead of the existing function's Sonnet model. The old `generate_recap` is still used by `nightly_recap_batch` in the arq worker; it can be migrated to Haiku in a follow-up.

- [ ] **Step 1: Write the failing test for answer-based recap**

```python
# backend/tests/test_recap_trigger.py
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_recap_trigger.py -v`
Expected: FAIL — `generate_recap_from_answers` not found

- [ ] **Step 3: Add generate_recap_from_answers to recap_generator.py**

Add this function to `backend/services/recap_generator.py` after the existing `generate_recap`:

```python
async def generate_recap_from_answers(
    paired_answers: list[dict], round_number: int
) -> str:
    """Generate recap from actual paired answers.

    Each item in paired_answers: {question_text, answer_a, answer_b}
    """
    if not paired_answers:
        return "今天的对话很特别，值得好好回味。"

    lines = []
    for qa in paired_answers:
        lines.append(f"问题：{qa['question_text']}")
        lines.append(f"  A的回答：{qa['answer_a']}")
        lines.append(f"  B的回答：{qa['answer_b']}")

    prompt = (
        f"你是一个温暖的关系见证者。两个人在第{round_number}次见面中的对话：\n"
        + "\n".join(lines)
        + "\n\n请用温暖、简洁的语气（不超过150字）写一段私人小结。"
        "提炼他们聊到的主题和共鸣点，指出有趣的差异。"
        "不要提及对方名字或A/B。只输出小结本身。"
    )
    resp = await anthropic_client.messages.create(
        model=settings.haiku_model,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text.strip()[:2000]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_recap_trigger.py -v`
Expected: All 2 tests PASS

- [ ] **Step 5: Hook recap generation into end_session**

In `backend/api/sessions.py`, in the `end_session` function, after `session.completed_at = datetime.now(timezone.utc)` (line 311), add the recap trigger:

```python
        # Trigger AI recap generation (best-effort, blocking — adds ~1-2s latency)
        try:
            paired = await _build_paired_answers(session_id, session.match_id, db)
            if paired:
                from services.recap_generator import generate_recap_from_answers
                session.ai_recap = await generate_recap_from_answers(
                    paired, session.round_number
                )
        except Exception:
            pass  # recap is best-effort, don't fail the session end
```

And add this helper at the bottom of the file (or before the endpoint):

```python
async def _build_paired_answers(
    session_id: str, match_id: str, db: AsyncSession
) -> list[dict]:
    """Pair up answers from both users for recap generation."""
    match = await db.get(Match, match_id)
    if not match:
        return []
    answers_result = await db.execute(
        select(QuestionAnswer)
        .where(QuestionAnswer.session_id == session_id)
        .order_by(QuestionAnswer.question_id)
    )
    all_answers = answers_result.scalars().all()

    # Group by question_id
    by_q: dict[int, dict] = {}
    for a in all_answers:
        if a.question_id not in by_q:
            q = get_question(a.question_id)
            by_q[a.question_id] = {
                "question_text": q["localized_zh"] if q else f"问题{a.question_id}",
                "answer_a": "",
                "answer_b": "",
            }
        if a.user_id == match.user_a_id:
            by_q[a.question_id]["answer_a"] = a.answer_text
        else:
            by_q[a.question_id]["answer_b"] = a.answer_text

    return [v for v in by_q.values() if v["answer_a"] and v["answer_b"]]
```

Note: `get_question` is already imported in `sessions.py` line 11 — no new import needed.

- [ ] **Step 6: Commit**

```bash
git add backend/services/recap_generator.py backend/api/sessions.py backend/tests/test_recap_trigger.py
git commit -m "feat: generate AI recap from actual answers on session end

Pairs both users' answers per question, sends to Claude Haiku for
warm recap. Stored in Session.ai_recap. Best-effort (won't block
session completion on failure).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Add Recap Endpoint

**Files:**
- Modify: `backend/api/sessions.py`
- Create: `backend/tests/test_recap_endpoint.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_recap_endpoint.py
import pytest


@pytest.mark.asyncio
async def test_get_recap(client, seed_session, auth_headers, db):
    """GET /sessions/{id}/recap returns the AI recap."""
    seed_session.ai_recap = "今天你们聊了关于完美一天的话题。"
    await db.commit()

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
    resp = await client.get(
        f"/api/sessions/{seed_session.id}/recap",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["recap"] is None


@pytest.mark.asyncio
async def test_get_recap_forbidden(client, seed_session):
    """GET /sessions/{id}/recap returns 403 for unauthorized user."""
    from services.auth_service import create_token
    other_headers = {"Authorization": f"Bearer {create_token('nonexistent-user')}"}
    resp = await client.get(
        f"/api/sessions/{seed_session.id}/recap",
        headers=other_headers,
    )
    assert resp.status_code == 403
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_recap_endpoint.py -v`
Expected: FAIL — 404/405 (endpoint doesn't exist)

- [ ] **Step 3: Add the recap endpoint**

In `backend/api/sessions.py`, add a new endpoint:

```python
@router.get("/{session_id}/recap")
async def get_recap(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the AI-generated recap for a completed session."""
    session = await db.get(DBSession, session_id)
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if not match or current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    return {"session_id": session_id, "recap": session.ai_recap}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_recap_endpoint.py -v`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/api/sessions.py backend/tests/test_recap_endpoint.py
git commit -m "feat: add GET /sessions/{id}/recap endpoint

Returns the AI-generated session recap. Null if not yet generated.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Add `compatibility_bucket` to Pool Response

The spec defines bucket values as `romantic`, `warm`, `elegant`, `tropical`, `whimsical` for frontend consumption. The existing `bloom_assigner.py` uses internal names (`grounded`, `contrast`, `adventurous`, `curious`). We add a mapping layer to translate.

**Files:**
- Modify: `backend/api/pool.py:46-58`
- Modify: `backend/services/bloom_assigner.py`
- Create: `backend/tests/test_pool_bucket.py`

- [ ] **Step 1: Write the failing test for classify_compatibility export + mapping**

```python
# backend/tests/test_pool_bucket.py
def test_classify_romantic():
    """High overlap tags = romantic bucket."""
    from services.bloom_assigner import classify_compatibility
    result = classify_compatibility(
        tags_a=["内向", "爱阅读", "温柔"],
        tags_b=["内向", "爱阅读", "独立"],
        goals_a="", goals_b="",
    )
    assert result == "romantic"


def test_classify_adventurous():
    """Both have adventure tags = adventurous (internal) -> tropical (API)."""
    from services.bloom_assigner import classify_compatibility, compatibility_bucket_for_api
    internal = classify_compatibility(
        tags_a=["热爱旅行", "外向"],
        tags_b=["热爱旅行", "活泼"],
        goals_a="", goals_b="",
    )
    assert internal == "adventurous"
    assert compatibility_bucket_for_api(internal) == "tropical"


def test_classify_default():
    """Empty tags = romantic (default)."""
    from services.bloom_assigner import classify_compatibility
    result = classify_compatibility(
        tags_a=None, tags_b=None,
        goals_a=None, goals_b=None,
    )
    assert result == "romantic"


def test_bucket_api_mapping():
    """All internal buckets map to spec-defined API values."""
    from services.bloom_assigner import compatibility_bucket_for_api
    assert compatibility_bucket_for_api("romantic") == "romantic"
    assert compatibility_bucket_for_api("grounded") == "warm"
    assert compatibility_bucket_for_api("contrast") == "elegant"
    assert compatibility_bucket_for_api("adventurous") == "tropical"
    assert compatibility_bucket_for_api("curious") == "whimsical"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_pool_bucket.py -v`
Expected: FAIL — `cannot import name 'classify_compatibility'`

- [ ] **Step 3: Make classify_compatibility public + add API mapping**

In `backend/services/bloom_assigner.py`:

1. Rename `_classify_compatibility` to `classify_compatibility` (remove underscore)
2. Update the call in `assign_bloom_type` to `classify_compatibility`
3. Add the mapping function:

```python
# Maps internal bucket names to spec-defined API values
_BUCKET_TO_API = {
    "romantic": "romantic",
    "grounded": "warm",
    "contrast": "elegant",
    "adventurous": "tropical",
    "curious": "whimsical",
}


def compatibility_bucket_for_api(internal_bucket: str) -> str:
    """Convert internal bucket name to API-facing value per UI spec."""
    return _BUCKET_TO_API.get(internal_bucket, "romantic")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_pool_bucket.py -v`
Expected: All 4 tests PASS

- [ ] **Step 5: Add compatibility_bucket to pool response**

In `backend/api/pool.py`, add import:

```python
from services.bloom_assigner import classify_compatibility, compatibility_bucket_for_api
```

In the list comprehension (lines 46-58), compute and add the bucket. The response builds entries from `rows` (UserCandidate) and `users_map`. Add inside the dict comprehension:

```python
            "compatibility_bucket": compatibility_bucket_for_api(
                classify_compatibility(
                    tags_a=current_user.personality_tags,
                    tags_b=users_map[r.candidate_id].personality_tags,
                    goals_a=current_user.life_goals,
                    goals_b=users_map[r.candidate_id].life_goals,
                )
            ),
```

- [ ] **Step 6: Run existing pool tests**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_pool.py tests/test_pool_bucket.py -v`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add backend/services/bloom_assigner.py backend/api/pool.py backend/tests/test_pool_bucket.py
git commit -m "feat: add compatibility_bucket to pool response

Maps internal compatibility classification to spec-defined API values
(romantic/warm/elegant/tropical/whimsical) for frontend species preview.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Add User.preferences Column + Migration

**Files:**
- Modify: `backend/db/models.py:19-35` (User class)
- Create: `backend/db/migrations/versions/xxxx_add_user_preferences.py` (via alembic)
- Create: `backend/tests/test_user_preferences.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_user_preferences.py
import pytest


@pytest.mark.asyncio
async def test_user_preferences_default_none(db):
    """New user has preferences=None by default."""
    from db.models import User
    u = User(phone="13800009999")
    db.add(u)
    await db.commit()
    await db.refresh(u)
    assert u.preferences is None


@pytest.mark.asyncio
async def test_user_preferences_json(db):
    """User preferences stores and retrieves JSON."""
    from db.models import User
    u = User(phone="13800009998", preferences={"renderer": "svg", "theme": "parchment"})
    db.add(u)
    await db.commit()
    await db.refresh(u)
    assert u.preferences["renderer"] == "svg"
    assert u.preferences["theme"] == "parchment"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_user_preferences.py -v`
Expected: FAIL — `User() got unexpected keyword argument 'preferences'`

- [ ] **Step 3: Add preferences column to User model**

In `backend/db/models.py`, add to the User class (after `enrichment`):

```python
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, default=None)
```

- [ ] **Step 4: Generate Alembic migration**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m alembic revision --autogenerate -m "add user preferences column"`
Expected: New migration file created in `db/migrations/versions/`

Review the generated migration to confirm it only adds the `preferences` column.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/test_user_preferences.py -v`
Expected: All 2 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/db/models.py backend/db/migrations/versions/*preferences* backend/tests/test_user_preferences.py
git commit -m "feat: add User.preferences JSON column

Stores user preferences (renderer, theme, haptic). Nullable, defaults
to None. Alembic migration included.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Run Full Test Suite + Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd /d/software/google_drive_backup/resonance/backend && python -m pytest tests/ -v --tb=short`
Expected: All tests PASS including new tests from Tasks 1-6

- [ ] **Step 2: Verify all new API response fields**

Check the following endpoints return the new fields:
- `GET /api/pipeline` -> each entry has `bloom_stage` (int 0-4)
- `GET /api/sessions/{id}/state` -> has `questions_answered_count` (int)
- `GET /api/sessions/{id}/recap` -> has `recap` (string|null)
- `GET /api/pool` -> each candidate has `compatibility_bucket` (string)

- [ ] **Step 3: Commit any final fixes**

Only if tests revealed issues. Otherwise, skip.

---

## Scope Notes

**This plan covers backend only (Layer 2.2 + 2.3 of the spec).** Frontend work (Layer 1 + Layer 2.1) is deferred until after v0.dev base generation. A separate plan will be created for:

- Renderer Registry Architecture (TypeScript interfaces, SVG renderer, species data)
- Tactile Design System (CSS custom properties, SVG filters)
- PixelAvatar + PhotoReveal components
- Micro-interactions
- Product features (P1 Bloom interactions, P2 voice/timeline, P3 themes)

**Priority mapping:**
| Task | Spec Priority | Why Now |
|------|--------------|---------|
| Task 1: bloom_stage | P0 | Frontend needs this for Bloom rendering |
| Task 2: questions_answered_count | P0 | Frontend needs this for progressive photo unlock |
| Task 3: recap generation hook | P1 | Enables AI recap feature, uses existing infrastructure |
| Task 4: recap endpoint | P1 | Serves generated recaps to frontend |
| Task 5: compatibility_bucket | P1 | Frontend needs this for pool species preview |
| Task 6: User.preferences | P2 prep | Schema migration, small change, do early |

**Intentionally deferred (P2):**
| Endpoint | Reason |
|----------|--------|
| `GET /api/species` | v1 uses frontend constants; backend endpoint only needed when species become server-managed |
| `PUT /api/profile/preferences` | Column added in Task 6, but endpoint deferred until frontend theme/renderer switching is built |

**Follow-up notes:**
- Migrate existing `generate_recap` (nightly batch) from Sonnet to Haiku for cost consistency
- Add `[:2000]` truncation to existing `generate_recap` function
