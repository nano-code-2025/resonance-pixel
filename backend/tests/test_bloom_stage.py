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
