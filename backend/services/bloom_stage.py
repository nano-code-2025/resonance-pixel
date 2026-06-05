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
