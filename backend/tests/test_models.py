import pytest
from db.models import User, Approach, Match, Session, Offer, UserCandidate

def test_user_model_has_required_fields():
    u = User(phone="13800000000", age=28, city="成都", gender="F")
    assert u.visibility == "active"  # default

def test_approach_has_expires_at():
    from datetime import datetime, timedelta, timezone
    a = Approach(initiator_id="x", receiver_id="y", tier="standard")
    assert a.expires_at is not None
    # expires_at should be ~72h in the future
    delta = a.expires_at - datetime.now(timezone.utc)
    assert timedelta(hours=71) < delta < timedelta(hours=73)

def test_offer_unique_constraint_defined():
    from sqlalchemy import inspect
    from db.models import Base
    # check UniqueConstraint on offers table exists
    table = Base.metadata.tables["offers"]
    unique_constraints = [c for c in table.constraints if hasattr(c, 'columns')]
    # The UNIQUE on match_id should be there
    assert any("match_id" in [col.name for col in uc.columns] for uc in unique_constraints)

def test_user_candidate_composite_pk():
    from db.models import Base
    table = Base.metadata.tables["user_candidates"]
    pk_cols = [col.name for col in table.primary_key.columns]
    assert "user_id" in pk_cols
    assert "candidate_id" in pk_cols
