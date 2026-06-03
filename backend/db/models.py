import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, JSON,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    selfie_url: Mapped[Optional[str]] = mapped_column(String, default=None)
    age: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    city: Mapped[Optional[str]] = mapped_column(String(100), default=None)
    gender: Mapped[Optional[str]] = mapped_column(String(10), default=None)
    education: Mapped[Optional[str]] = mapped_column(String(200), default=None)
    work: Mapped[Optional[str]] = mapped_column(String(200), default=None)
    life_goals: Mapped[Optional[str]] = mapped_column(String(500), default=None)
    personality_tags: Mapped[Optional[list]] = mapped_column(JSON, default=None)
    requirements: Mapped[Optional[dict]] = mapped_column(JSON, default=None)
    enrichment: Mapped[Optional[dict]] = mapped_column(JSON, default=None)
    visibility: Mapped[str] = mapped_column(String(20), default="active")
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        if 'visibility' not in kwargs:
            kwargs['visibility'] = 'active'
        if 'id' not in kwargs:
            kwargs['id'] = _uuid()
        if 'created_at' not in kwargs:
            kwargs['created_at'] = datetime.now(timezone.utc)
        super().__init__(**kwargs)


def _expires_at_default():
    return datetime.now(timezone.utc) + timedelta(hours=72)


def _highlights_default():
    return []


class Approach(Base):
    __tablename__ = "approaches"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    initiator_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    tier: Mapped[str] = mapped_column(String(20), default="standard")
    ai_message: Mapped[Optional[str]] = mapped_column(String(200), default=None)
    payment_id: Mapped[Optional[str]] = mapped_column(String, default=None)
    quality_rating: Mapped[Optional[str]] = mapped_column(String(10), default=None)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_expires_at_default)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)

    def __init__(self, **kwargs):
        if 'id' not in kwargs:
            kwargs['id'] = _uuid()
        if 'status' not in kwargs:
            kwargs['status'] = 'pending'
        if 'tier' not in kwargs:
            kwargs['tier'] = 'standard'
        if 'expires_at' not in kwargs:
            kwargs['expires_at'] = _expires_at_default()
        if 'created_at' not in kwargs:
            kwargs['created_at'] = datetime.now(timezone.utc)
        super().__init__(**kwargs)


class Match(Base):
    __tablename__ = "matches"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_a_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    user_b_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    approach_id: Mapped[str] = mapped_column(ForeignKey("approaches.id"), nullable=False)
    current_round: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="active")
    venue_suggestions: Mapped[Optional[list]] = mapped_column(JSON, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        if 'id' not in kwargs:
            kwargs['id'] = _uuid()
        if 'current_round' not in kwargs:
            kwargs['current_round'] = 1
        if 'status' not in kwargs:
            kwargs['status'] = 'active'
        if 'created_at' not in kwargs:
            kwargs['created_at'] = datetime.now(timezone.utc)
        super().__init__(**kwargs)


class Session(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    match_id: Mapped[str] = mapped_column(ForeignKey("matches.id"), nullable=False)
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    session_type: Mapped[str] = mapped_column(String(20), default="in_person")
    host_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)
    feishu_meeting_url: Mapped[Optional[str]] = mapped_column(String, default=None)
    questions_completed: Mapped[Optional[list]] = mapped_column(JSON, default=_highlights_default)
    rating_a: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    rating_b: Mapped[Optional[int]] = mapped_column(Integer, default=None)
    advance_a: Mapped[Optional[bool]] = mapped_column(Boolean, default=None)
    advance_b: Mapped[Optional[bool]] = mapped_column(Boolean, default=None)
    ai_recap: Mapped[Optional[str]] = mapped_column(String(2000), default=None)

    def __init__(self, **kwargs):
        if 'id' not in kwargs:
            kwargs['id'] = _uuid()
        if 'session_type' not in kwargs:
            kwargs['session_type'] = 'in_person'
        if 'questions_completed' not in kwargs:
            kwargs['questions_completed'] = _highlights_default()
        super().__init__(**kwargs)


class Offer(Base):
    __tablename__ = "offers"
    __table_args__ = (UniqueConstraint("match_id", name="uq_offer_per_match"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    match_id: Mapped[str] = mapped_column(ForeignKey("matches.id"), nullable=False)
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=None)

    def __init__(self, **kwargs):
        if 'id' not in kwargs:
            kwargs['id'] = _uuid()
        if 'status' not in kwargs:
            kwargs['status'] = 'pending'
        if 'sent_at' not in kwargs:
            kwargs['sent_at'] = datetime.now(timezone.utc)
        super().__init__(**kwargs)


class UserCandidate(Base):
    """Pre-computed pool scores. Written by pool curator, read by /pool."""
    __tablename__ = "user_candidates"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    candidate_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    highlights: Mapped[list] = mapped_column(JSON, default=_highlights_default)
    scored_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        if 'highlights' not in kwargs:
            kwargs['highlights'] = _highlights_default()
        if 'scored_at' not in kwargs:
            kwargs['scored_at'] = datetime.now(timezone.utc)
        super().__init__(**kwargs)
