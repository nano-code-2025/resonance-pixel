# Resonance MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Resonance MVP — pixel-art dating platform with AI agent matching, Arthur Aron's 36 questions as structured date guide, and pay-per-approach model.

**Architecture:** FastAPI backend (Python 3.12) with PostgreSQL + Redis; React + TypeScript frontend with pixel design system; Claude API for AI features (Haiku for scoring, Sonnet for writing); REST polling for session sync (SSE in V1.1).

**Tech Stack:** FastAPI, SQLAlchemy 2.x async, Alembic, asyncpg, Redis (aioredis), anthropic SDK, python-jose (JWT), React 18, TypeScript, Vite, TailwindCSS, SWR

**Spec:** `docs/superpowers/specs/2026-06-03-resonance-redesign-design.md`

---

## File Map

### Backend (new/rewrite)
```
backend/
  main.py                          MODIFY — update routers
  app_config.py                    CREATE — centralized settings
  db/
    __init__.py                    CREATE
    models.py                      CREATE — SQLAlchemy ORM (User, Approach, Match, Session, Offer)
    session.py                     CREATE — async engine + session factory
    migrations/                    CREATE — Alembic (alembic init)
  api/
    auth.py                        CREATE — POST /auth/send-otp, /auth/verify
    profile.py                     REWRITE — GET/PUT /profile
    pool.py                        CREATE — GET /pool
    approaches.py                  CREATE — POST /approaches, PATCH /approaches/{id}/respond
    pipeline.py                    CREATE — GET /pipeline
    sessions.py                    CREATE — POST /sessions, GET /sessions/{id}/state, POST /sessions/{id}/advance, POST /sessions/{id}/end
    offers.py                      CREATE — POST /offers, PATCH /offers/{id}/respond
    match.py                       REWRITE — GET /matches/{id}
  services/
    auth_service.py                CREATE — OTP generation, JWT encode/decode
    pool_curator.py                CREATE — Claude Haiku scoring, PostgreSQL cache
    approach_writer.py             CREATE — Claude Sonnet message draft
    session_guide.py               CREATE — Redis state R/W
    pixel_avatar.py                CREATE — deterministic pixel avatar generation
  core/
    aron_questions.py              CREATE — 36 questions (zh localized)
    meeting_service.py             CREATE — abstract MeetingService interface
  models/
    schemas.py                     REWRITE — Pydantic v2 request/response models
  tests/
    conftest.py                    CREATE — pytest fixtures, async test DB, seed helpers (User, Match, Session, Offer)
    test_auth.py                   CREATE
    test_profile.py                CREATE
    test_pool.py                   CREATE
    test_approaches.py             CREATE
    test_sessions.py               CREATE
    test_offers.py                 CREATE
```

### Frontend (all new)
```
frontend/
  index.html
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx
    styles/
      globals.css                  pixel base styles
      tokens.ts                    color + typography constants
    components/ui/
      PixelAvatar.tsx              deterministic 8-bit portrait from user id
      PixelGrid.tsx                dot-grid background texture
      PixelBar.tsx                 fit score progress bar
      QuestionCard.tsx             single Aron question, typewriter reveal
      Timer.tsx                    7-segment pixel countdown
      ProfileCard.tsx              PixelAvatar + score + highlights
      PipelineItem.tsx             match row with round badge
    pages/
      Auth/index.tsx               phone OTP entry
      Onboarding/
        index.tsx                  wizard shell
        StepSelfie.tsx
        StepFacts.tsx
        StepEnrichment.tsx         optional Bazi/MBTI
        StepRequirements.tsx
      Pool/
        index.tsx
        ApproachModal.tsx          tier select + message preview + confirm
      Pipeline/index.tsx
      Session/
        index.tsx
        RatingModal.tsx
      Recap/index.tsx
      Profile/index.tsx
    hooks/
      useAuth.ts
      usePool.ts
      usePipeline.ts
      useSession.ts                polling every 3s
    services/
      api.ts                       typed fetch wrapper
```

---

## Phase 1 — Backend Foundation

### Task 1: Project Setup & Dependencies

**Files:** `backend/app_config.py`, `backend/requirements.txt`, `backend/db/session.py`

- [ ] Add dependencies to `requirements.txt`:
```
fastapi>=0.115
uvicorn[standard]>=0.30
sqlalchemy[asyncio]>=2.0
asyncpg>=0.29
alembic>=1.13
redis>=5.0
anthropic>=0.40
python-jose[cryptography]>=3.3
passlib[bcrypt]>=1.7
python-dotenv>=1.0
httpx>=0.27
pytest>=8.0
pytest-asyncio>=0.23
pytest-mock>=3.14
```

- [ ] Create `backend/app_config.py`:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:pass@localhost/resonance"
    redis_url: str = "redis://localhost:6379"
    jwt_secret: str = "change-me"
    jwt_expire_minutes: int = 60 * 24 * 7
    anthropic_api_key: str = ""
    haiku_model: str = "claude-haiku-4-5-20251001"
    sonnet_model: str = "claude-sonnet-4-6"
    cos_bucket: str = ""
    cos_region: str = "ap-chengdu"
    otp_ttl_seconds: int = 300
    approach_weekly_limit: int = 3
    approach_cooldown_hours: int = 48
    pool_cache_ttl_seconds: int = 21600  # 6h

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] Create `backend/db/session.py`:
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app_config import settings

engine = create_async_engine(settings.database_url, pool_size=20, max_overflow=10)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] Update `backend/.env.example` with all new keys
- [ ] Install: `pip install -r requirements.txt`

---

### Task 2: Database Models

**Files:** `backend/db/models.py`, `backend/db/__init__.py`

- [ ] Write failing test `tests/test_models.py`:
```python
import pytest
from db.models import User, Approach, Match, Session, Offer

def test_user_model_has_required_fields():
    u = User(phone="13800000000", age=28, city="成都", gender="F")
    assert u.visibility == "active"  # default

def test_approach_has_expires_at():
    from datetime import datetime, timedelta
    a = Approach(initiator_id="x", receiver_id="y", tier="standard")
    assert a.expires_at is not None
```

- [ ] Run: `pytest tests/test_models.py` → FAIL

- [ ] Create `backend/db/models.py`:
```python
import uuid
from datetime import datetime, timedelta
from sqlalchemy import String, Integer, Float, Boolean, DateTime, JSON, Enum as SAEnum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

def _uuid(): return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    selfie_url: Mapped[str | None] = mapped_column(String)
    age: Mapped[int | None] = mapped_column(Integer)
    city: Mapped[str | None] = mapped_column(String(100))
    gender: Mapped[str | None] = mapped_column(String(10))
    education: Mapped[str | None] = mapped_column(String(200))
    work: Mapped[str | None] = mapped_column(String(200))
    life_goals: Mapped[str | None] = mapped_column(String(500))
    personality_tags: Mapped[list | None] = mapped_column(JSON)
    requirements: Mapped[dict | None] = mapped_column(JSON)
    enrichment: Mapped[dict | None] = mapped_column(JSON)
    visibility: Mapped[str] = mapped_column(String(20), default="active")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Approach(Base):
    __tablename__ = "approaches"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    initiator_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    tier: Mapped[str] = mapped_column(String(20), default="standard")
    ai_message: Mapped[str | None] = mapped_column(String(200))
    payment_id: Mapped[str | None] = mapped_column(String)
    quality_rating: Mapped[str | None] = mapped_column(String(10))
    expires_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=72))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime)

class Match(Base):
    __tablename__ = "matches"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_a_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    user_b_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    approach_id: Mapped[str] = mapped_column(ForeignKey("approaches.id"), nullable=False)
    current_round: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="active")
    venue_suggestions: Mapped[list | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Session(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    match_id: Mapped[str] = mapped_column(ForeignKey("matches.id"), nullable=False)
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    session_type: Mapped[str] = mapped_column(String(20), default="in_person")
    host_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    feishu_meeting_url: Mapped[str | None] = mapped_column(String)
    questions_completed: Mapped[list | None] = mapped_column(JSON, default=list)
    rating_a: Mapped[int | None] = mapped_column(Integer)
    rating_b: Mapped[int | None] = mapped_column(Integer)
    advance_a: Mapped[bool | None] = mapped_column(Boolean)
    advance_b: Mapped[bool | None] = mapped_column(Boolean)
    ai_recap: Mapped[str | None] = mapped_column(String(2000))

class Offer(Base):
    __tablename__ = "offers"
    __table_args__ = (UniqueConstraint("match_id", name="uq_offer_per_match"),)
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    match_id: Mapped[str] = mapped_column(ForeignKey("matches.id"), nullable=False)
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime)

class UserCandidate(Base):
    """Pre-computed pool scores. Written by pool curator, read by /pool."""
    __tablename__ = "user_candidates"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    candidate_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    highlights: Mapped[list] = mapped_column(JSON, default=list)
    scored_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [ ] Run: `pytest tests/test_models.py` → PASS
- [ ] `git add -A && git commit -m "feat: add SQLAlchemy ORM models"`

---

### Task 3: Database Migrations

**Files:** `backend/db/migrations/`

- [ ] Init Alembic: `cd backend && alembic init db/migrations`
- [ ] Edit `alembic.ini`: set `sqlalchemy.url = postgresql+asyncpg://...` (use env var)
- [ ] Edit `db/migrations/env.py` to use async engine and import `Base` from `db.models`
- [ ] Generate migration: `alembic revision --autogenerate -m "initial schema"`
- [ ] Review generated migration file, verify all tables present
- [ ] Apply: `alembic upgrade head`
- [ ] Add critical indexes manually in migration:
```python
op.create_index("idx_users_visibility_gender", "users", ["visibility", "gender"])
op.create_index("idx_approaches_receiver_status", "approaches", ["receiver_id", "status"])
op.create_index("idx_matches_user_a_status", "matches", ["user_a_id", "status"])
op.create_index("idx_matches_user_b_status", "matches", ["user_b_id", "status"])
op.create_index("idx_sessions_match_id", "sessions", ["match_id"])
```
- [ ] `git add -A && git commit -m "feat: add Alembic migrations with indexes"`

---

### Task 3b: Test Fixtures (conftest.py)

**Files:** `backend/tests/conftest.py`

- [ ] Create `backend/tests/conftest.py`:
```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from db.models import Base, User, Approach, Match, Session as SessionModel
from db.session import get_db
from main import app
from services.auth_service import create_token

TEST_DB = "postgresql+asyncpg://user:pass@localhost/resonance_test"

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    engine = create_async_engine(TEST_DB)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture
async def db(db_engine):
    TestSession = async_sessionmaker(db_engine, expire_on_commit=False)
    async with TestSession() as session:
        yield session
        await session.rollback()

@pytest_asyncio.fixture
async def client(db):
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def seed_user(db) -> User:
    u = User(phone="13800000001", age=28, city="成都", gender="F",
             life_goals="寻找真实连接", personality_tags=["内向", "爱阅读"],
             requirements={"preferences": ["诚实"], "dealbreakers": []})
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u

@pytest_asyncio.fixture
async def seed_candidate(db) -> User:
    u = User(phone="13800000002", age=30, city="成都", gender="M",
             life_goals="户外运动爱好者", personality_tags=["外向"])
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u

@pytest.fixture
def auth_headers(seed_user) -> dict:
    return {"Authorization": f"Bearer {create_token(seed_user.id)}"}

@pytest_asyncio.fixture
async def seed_match(db, seed_user, seed_candidate) -> Match:
    approach = Approach(initiator_id=seed_user.id, receiver_id=seed_candidate.id,
                        tier="standard", status="accepted")
    db.add(approach)
    await db.flush()
    match = Match(user_a_id=seed_user.id, user_b_id=seed_candidate.id, approach_id=approach.id)
    db.add(match)
    await db.commit()
    await db.refresh(match)
    return match

@pytest_asyncio.fixture
async def seed_session(db, seed_match, seed_user) -> SessionModel:
    s = SessionModel(match_id=seed_match.id, round_number=1,
                     host_user_id=seed_user.id, questions_completed=[])
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s

@pytest.fixture
def non_host_headers(seed_match, seed_candidate) -> dict:
    return {"Authorization": f"Bearer {create_token(seed_candidate.id)}"}
```

- [ ] `git add tests/conftest.py && git commit -m "test: add pytest fixtures for all test modules"`

---

### Task 4: Auth Service (OTP + JWT)

**Files:** `backend/services/auth_service.py`, `backend/api/auth.py`

- [ ] Write `tests/test_auth.py`:
```python
import pytest
from services.auth_service import generate_otp, create_token, decode_token

def test_otp_is_6_digits():
    otp = generate_otp()
    assert len(otp) == 6 and otp.isdigit()

def test_token_roundtrip():
    token = create_token("user-123")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"

def test_invalid_token_raises():
    with pytest.raises(ValueError):
        decode_token("not-a-token")
```

- [ ] Run → FAIL (generate_otp not defined)
- [ ] Create `backend/services/auth_service.py`:
```python
import random, string
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app_config import settings

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.jwt_secret, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError:
        raise ValueError("Invalid token")
```

- [ ] Create `backend/api/auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.session import get_db
from db.models import User
from services.auth_service import generate_otp, create_token
from app_config import settings
import redis.asyncio as aioredis

router = APIRouter()

async def get_redis():
    r = aioredis.from_url(settings.redis_url)
    try:
        yield r
    finally:
        await r.aclose()

class OtpSendRequest(BaseModel):
    phone: str

class OtpVerifyRequest(BaseModel):
    phone: str
    otp: str

@router.post("/send-otp")
async def send_otp(body: OtpSendRequest, r=Depends(get_redis)):
    phone = body.phone
    # Rate limit: max 5 OTPs per phone per hour
    key = f"otp_rate:{phone}"
    count = await r.incr(key)
    if count == 1:
        await r.expire(key, 3600)
    if count > 5:
        raise HTTPException(429, "Too many OTP requests")
    otp = generate_otp()
    await r.setex(f"otp:{phone}", settings.otp_ttl_seconds, otp)
    # MVP: log OTP instead of SMS (replace with 腾讯云短信 in production)
    print(f"[OTP] {phone}: {otp}")
    return {"message": "OTP sent"}

@router.post("/verify")
async def verify_otp(body: OtpVerifyRequest, db: AsyncSession = Depends(get_db), r=Depends(get_redis)):
    phone, otp = body.phone, body.otp
    stored = await r.get(f"otp:{phone}")
    if not stored or stored.decode() != otp:
        raise HTTPException(400, "Invalid or expired OTP")
    await r.delete(f"otp:{phone}")
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()
    if not user:
        user = User(phone=phone)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    token = create_token(user.id)
    return {"token": token, "user_id": user.id, "is_new": user.age is None}
```

- [ ] Register router in `main.py`: `app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])`
- [ ] Run: `pytest tests/test_auth.py` → PASS
- [ ] `git commit -m "feat: phone OTP + JWT auth"`

---

### Task 5: Aron Questions Data

**Files:** `backend/core/aron_questions.py`

- [ ] Write `tests/test_aron.py`:
```python
from core.aron_questions import QUESTIONS, get_questions_for_round

def test_36_questions_exist():
    assert len(QUESTIONS) >= 36

def test_round_1_returns_12():
    qs = get_questions_for_round(1)
    assert len(qs) == 12

def test_each_question_has_zh():
    for q in QUESTIONS:
        assert q["zh"], f"Q{q['id']} missing zh"
```

- [ ] Run → FAIL
- [ ] Create `backend/core/aron_questions.py` (first 6 shown; implement all 36+):
  - Each question has `id`, `group`, `zh` (direct translation), `localized_zh` (culturally adapted for China — modify any questions that feel morbid or inauspicious before launch), `en`.
  - `get_questions_for_round()` returns `localized_zh` as the display field.
```python
QUESTIONS = [
    # Group 1: Round 1 (初见) Q1-Q12
    # localized_zh = culturally adapted version; zh = direct translation kept for reference
    {"id": 1, "group": 1,
     "zh": "如果可以邀请世界上任何人共进晚餐，你会选择谁？",
     "localized_zh": "如果可以邀请世界上任何人共进晚餐，你会选择谁？",
     "en": "Given the choice of anyone in the world, whom would you want as a dinner guest?"},
    {"id": 2, "group": 1, "zh": "你想成为名人吗？以什么方式？", "en": "Would you like to be famous? In what way?"},
    {"id": 3, "group": 1, "zh": "在打电话之前，你会先排练要说的话吗？为什么？", "en": "Before making a telephone call, do you ever rehearse what you are going to say? Why?"},
    {"id": 4, "group": 1, "zh": "对你来说，一个完美的一天是什么样的？", "en": "What would constitute a perfect day for you?"},
    {"id": 5, "group": 1, "zh": "你上次一个人唱歌是什么时候？给别人唱呢？", "en": "When did you last sing to yourself? To someone else?"},
    {"id": 6, "group": 1, "zh": "如果你能活到90岁，保持30岁时的心智或身体，你会选哪个？", "en": "If you could live to 90 and retain either the mind or body of a 30-year-old, which would you want?"},
    {"id": 7, "group": 1, "zh": "你有没有预感自己会怎么死？", "en": "Do you have a secret hunch about how you will die?"},
    {"id": 8, "group": 1, "zh": "说出你和对方三个共同点。", "en": "Name three things you and your partner appear to have in common."},
    {"id": 9, "group": 1, "zh": "你这辈子最感激什么？", "en": "For what in your life do you feel most grateful?"},
    {"id": 10, "group": 1, "zh": "如果可以改变自己的成长方式，你希望改变什么？", "en": "If you could change anything about the way you were raised, what would it be?"},
    {"id": 11, "group": 1, "zh": "用四分钟，尽可能详细地告诉对方你的人生故事。", "en": "Take four minutes and tell your partner your life story in as much detail as possible."},
    {"id": 12, "group": 1, "zh": "如果明天早上你醒来拥有某种才能或能力，会是什么？", "en": "If you could wake up tomorrow having gained any one quality or ability, what would it be?"},
    # Group 2: Round 2 (深聊) Q13-Q24
    {"id": 13, "group": 2, "zh": "如果有个水晶球能告诉你关于自己、人生或未来的真相，你想知道什么？", "en": "If a crystal ball could tell you the truth about yourself, your life, the future or anything else, what would you want to know?"},
    {"id": 14, "group": 2, "zh": "有没有什么事是你一直想做，但还没有做到的？为什么没做？", "en": "Is there something that you've dreamed of doing for a long time? Why haven't you done it?"},
    {"id": 15, "group": 2, "zh": "你一生中最大的成就是什么？", "en": "What is the greatest accomplishment of your life?"},
    {"id": 16, "group": 2, "zh": "在友谊中，你最看重什么？", "en": "What do you value most in a friendship?"},
    {"id": 17, "group": 2, "zh": "你最珍贵的记忆是什么？", "en": "What is your most treasured memory?"},
    {"id": 18, "group": 2, "zh": "你最糟糕的记忆是什么？", "en": "What is your most terrible memory?"},
    {"id": 19, "group": 2, "zh": "如果你知道自己一年后会突然去世，你会改变现在的生活方式吗？为什么？", "en": "If you knew that in one year you would die suddenly, would you change anything about the way you are now living? Why?"},
    {"id": 20, "group": 2, "zh": "友情对你意味着什么？", "en": "What does friendship mean to you?"},
    {"id": 21, "group": 2, "zh": "爱和感情在你的生活中扮演什么角色？", "en": "What roles do love and affection play in your life?"},
    {"id": 22, "group": 2, "zh": "轮流分享你认为对方的五个优点。", "en": "Alternate sharing something you consider a positive characteristic of your partner."},
    {"id": 23, "group": 2, "zh": "你的家庭关系亲密温暖吗？你的童年比别人快乐吗？", "en": "How close and warm is your family? Do you feel your childhood was happier than most other people's?"},
    {"id": 24, "group": 2, "zh": "你和妈妈的关系怎么样？", "en": "How do you feel about your relationship with your mother?"},
    # Group 3: Round 3 (见见我的圈子) Q25-Q36
    {"id": 25, "group": 3, "zh": "用"我们"各造三个真实的句子，比如'我们在这个房间里都感到……'", "en": "Make three true 'we' statements each. For instance, 'We are both in this room feeling...'"},
    {"id": 26, "group": 3, "zh": "完成这个句子：'我希望有人能和我一起……'", "en": "Complete this sentence: 'I wish I had someone with whom I could share...'"},
    {"id": 27, "group": 3, "zh": "如果你将来和对方成为好友，你希望对方了解你什么？", "en": "If you were going to become a close friend with your partner, please share what would be important for him or her to know."},
    {"id": 28, "group": 3, "zh": "告诉对方你喜欢他/她什么——真实地说，说一些你通常不会对刚认识的人说的话。", "en": "Tell your partner what you like about them; be very honest this time, saying things that you might not say to someone you've just met."},
    {"id": 29, "group": 3, "zh": "分享一件让你感到尴尬的事。", "en": "Share with your partner an embarrassing moment in your life."},
    {"id": 30, "group": 3, "zh": "你上次在另一个人面前哭是什么时候？一个人哭呢？", "en": "When did you last cry in front of another person? By yourself?"},
    {"id": 31, "group": 3, "zh": "告诉对方你已经喜欢他/她的什么。", "en": "Tell your partner something that you like about them already."},
    {"id": 32, "group": 3, "zh": "对你来说，什么是不能开玩笑的，如果有的话？", "en": "What, if anything, is too serious to be joked about?"},
    {"id": 33, "group": 3, "zh": "如果今晚你就要死去，没有机会和任何人交流，你最后悔没有告诉谁什么？你为什么一直没有告诉他/她？", "en": "If you were to die this evening with no opportunity to communicate with anyone, what would you most regret not having told someone? Why haven't you told them yet?"},
    {"id": 34, "group": 3, "zh": "你的房子着火了，里面有你所有的财物。救出家人和宠物后，你还有时间安全地冲进去一次，取出最后一件物品，你会取什么？为什么？", "en": "Your house, containing everything you own, catches fire. After saving your loved ones and pets, you have time to safely make a final dash to save any one item. What would it be? Why?"},
    {"id": 35, "group": 3, "zh": "在你的家庭成员中，谁的去世对你的打击最大？为什么？", "en": "Of all the people in your family, whose death would you find most disturbing? Why?"},
    {"id": 36, "group": 3, "zh": "分享一个个人问题，请对方给你一些如何处理它的建议。同时，请对方告诉你他/她认为你对这个问题有什么感受。", "en": "Share a personal problem and ask your partner's advice on how he or she might handle it. Also, ask your partner to reflect back to you how you seem to be feeling about the problem you have chosen."},
]

ROUND_RANGES = {1: range(1, 13), 2: range(13, 25), 3: range(25, 37)}

def get_questions_for_round(round_number: int) -> list[dict]:
    ids = ROUND_RANGES[round_number]
    return [q for q in QUESTIONS if q["id"] in ids]

def get_question(question_id: int) -> dict | None:
    return next((q for q in QUESTIONS if q["id"] == question_id), None)
```

- [ ] Run: `pytest tests/test_aron.py` → PASS
- [ ] `git commit -m "feat: add Aron 36 questions data"`

---

### Task 6: Profile API

**Files:** `backend/api/profile.py` (rewrite), `backend/models/schemas.py` (rewrite)

- [ ] Write `tests/test_profile.py`:
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_update_profile(client, auth_headers):
    resp = await client.put("/api/profile", json={
        "age": 28, "city": "成都", "gender": "F",
        "life_goals": "寻找真实的连接", "personality_tags": ["内向", "爱阅读"]
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["city"] == "成都"

@pytest.mark.asyncio
async def test_get_profile(client, auth_headers):
    resp = await client.get("/api/profile", headers=auth_headers)
    assert resp.status_code == 200
```

- [ ] Create `backend/models/schemas.py`:
```python
from pydantic import BaseModel
from typing import Optional

class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    city: Optional[str] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    work: Optional[str] = None
    life_goals: Optional[str] = None
    personality_tags: Optional[list[str]] = None
    requirements: Optional[dict] = None
    enrichment: Optional[dict] = None
    visibility: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    phone: str
    age: Optional[int]
    city: Optional[str]
    gender: Optional[str]
    life_goals: Optional[str]
    personality_tags: Optional[list[str]]
    requirements: Optional[dict]
    enrichment: Optional[dict]
    visibility: str
    selfie_url: Optional[str]
    is_complete: bool  # True when age, city, gender, requirements all set

class ApproachRequest(BaseModel):
    candidate_id: str
    tier: str = "standard"  # standard | personalized | premium

class ApproachResponse(BaseModel):
    id: str
    ai_message: str
    tier: str
    candidate: ProfileResponse

class SessionStateResponse(BaseModel):
    session_id: str
    current_question_index: int
    questions_completed: list[int]
    round_number: int
    is_host: bool
    session_type: str

class OfferRequest(BaseModel):
    match_id: str

class OfferRespondRequest(BaseModel):
    response: str  # accepted | not_yet | declined
```

- [ ] Rewrite `backend/api/profile.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.session import get_db
from db.models import User
from models.schemas import ProfileUpdate, ProfileResponse
from api.auth import get_current_user  # dependency returning User

router = APIRouter()

@router.get("", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return _to_response(current_user)

@router.put("", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return _to_response(current_user)

def _to_response(u: User) -> ProfileResponse:
    is_complete = all([u.age, u.city, u.gender, u.requirements])
    return ProfileResponse(**{
        "id": u.id, "phone": u.phone, "age": u.age, "city": u.city,
        "gender": u.gender, "life_goals": u.life_goals,
        "personality_tags": u.personality_tags, "requirements": u.requirements,
        "enrichment": u.enrichment, "visibility": u.visibility,
        "selfie_url": u.selfie_url, "is_complete": is_complete
    })
```

- [ ] Add `get_current_user` dependency to `api/auth.py`:
```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise HTTPException(401, "Invalid token")
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or user.deleted_at:
        raise HTTPException(401, "User not found")
    return user
```

- [ ] Run: `pytest tests/test_profile.py` → PASS
- [ ] `git commit -m "feat: profile API with JWT auth dependency"`

---

## Phase 2 — Core Product APIs

### Task 7: Pool Curator Service

**Files:** `backend/services/pool_curator.py`, `backend/api/pool.py`

- [ ] Write `tests/test_pool.py`:
```python
import pytest
from unittest.mock import AsyncMock, patch
from services.pool_curator import score_candidate, build_highlights

@pytest.mark.asyncio
async def test_score_candidate_returns_float():
    with patch("services.pool_curator.anthropic_client") as mock:
        mock.messages.create = AsyncMock(return_value=type('R', (), {
            'content': [type('C', (), {'text': '0.78'})()]
        })())
        score = await score_candidate("wants quiet person", "enjoys reading")
        assert 0.0 <= score <= 1.0

def test_highlights_are_three_strings():
    h = build_highlights({"city": "成都"}, {"city": "成都", "life_goals": "寻找真实连接"})
    assert len(h) == 3
    assert all(isinstance(s, str) for s in h)
```

- [ ] Run → FAIL
- [ ] Create `backend/services/pool_curator.py`:
```python
import anthropic
from app_config import settings
from db.models import User

anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

async def score_candidate(requirements_text: str, candidate_profile_text: str) -> float:
    """Score how well a candidate matches requirements. Returns 0.0-1.0."""
    prompt = f"""Rate how well this candidate matches the requirements.
Requirements: {requirements_text}
Candidate: {candidate_profile_text}
Reply with ONLY a decimal number between 0.0 and 1.0. Nothing else."""
    resp = await anthropic_client.messages.create(
        model=settings.haiku_model,
        max_tokens=10,
        messages=[{"role": "user", "content": prompt}]
    )
    try:
        return min(1.0, max(0.0, float(resp.content[0].text.strip())))
    except (ValueError, IndexError):
        return 0.5

def build_highlights(user_profile: dict, candidate_profile: dict) -> list[str]:
    """Generate 3 highlight strings explaining fit. Simple rule-based for MVP."""
    highlights = []
    if user_profile.get("city") == candidate_profile.get("city"):
        highlights.append(f"同在{candidate_profile.get('city', '同城')}")
    if candidate_profile.get("life_goals"):
        highlights.append(f"TA的目标：{candidate_profile['life_goals'][:30]}")
    tags = candidate_profile.get("personality_tags") or []
    if tags:
        highlights.append(f"性格标签：{'、'.join(tags[:2])}")
    while len(highlights) < 3:
        highlights.append("画像契合度较高")
    return highlights[:3]

def profile_to_text(user: User) -> str:
    parts = []
    if user.life_goals: parts.append(f"人生目标：{user.life_goals}")
    if user.personality_tags: parts.append(f"性格：{'、'.join(user.personality_tags)}")
    if user.city: parts.append(f"城市：{user.city}")
    if user.work: parts.append(f"工作：{user.work}")
    return "；".join(parts) or "暂无详细信息"

def requirements_to_text(user: User) -> str:
    req = user.requirements or {}
    parts = []
    if req.get("preferences"): parts.append("偏好：" + "、".join(req["preferences"]))
    if req.get("dealbreakers"): parts.append("不接受：" + "、".join(req["dealbreakers"]))
    return "；".join(parts) or "无特定要求"
```

- [ ] Create `backend/api/pool.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, not_, exists
from db.session import get_db
from db.models import User, Approach, UserCandidate
from api.auth import get_current_user
from services.pool_curator import score_candidate, build_highlights, profile_to_text, requirements_to_text
from app_config import settings
import redis.asyncio as aioredis
import json
from datetime import datetime, timedelta

router = APIRouter()

@router.get("")
async def get_pool(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Return top 20 pre-scored candidates. Trigger async rescore if stale."""
    # Check cache staleness
    cutoff = datetime.utcnow() - timedelta(seconds=settings.pool_cache_ttl_seconds)
    cached = await db.execute(
        select(UserCandidate)
        .where(UserCandidate.user_id == current_user.id)
        .where(UserCandidate.scored_at > cutoff)
        .order_by(UserCandidate.score.desc())
        .limit(20)
    )
    rows = cached.scalars().all()

    if not rows:
        # NOTE: This inline fallback is ONLY for the very first pool load before ARQ
        # has ever run for this user. Task 15 (ARQ worker) must be implemented before
        # beta launch to eliminate this path. In production, pool is always pre-computed.
        rows = await _compute_scores(current_user, db)

    # Fetch candidate users
    candidate_ids = [r.candidate_id for r in rows]
    users_result = await db.execute(select(User).where(User.id.in_(candidate_ids)))
    users_map = {u.id: u for u in users_result.scalars()}

    return [
        {
            "candidate_id": r.candidate_id,
            "score": round(r.score * 100),
            "highlights": r.highlights,
            "age": users_map[r.candidate_id].age,
            "city": users_map[r.candidate_id].city,
            "gender": users_map[r.candidate_id].gender,
            "personality_tags": users_map[r.candidate_id].personality_tags,
        }
        for r in rows if r.candidate_id in users_map
    ]

async def _compute_scores(user: User, db: AsyncSession) -> list[UserCandidate]:
    """Inline scoring for MVP. Max 50 candidates evaluated."""
    # Exclude already approached / self
    approached = select(Approach.receiver_id).where(Approach.initiator_id == user.id)
    candidates_q = await db.execute(
        select(User)
        .where(User.id != user.id)
        .where(User.visibility == "active")
        .where(User.deleted_at.is_(None))
        .where(not_(User.id.in_(approached)))
        .limit(50)
    )
    candidates = candidates_q.scalars().all()
    req_text = requirements_to_text(user)
    results = []
    for c in candidates:
        score = await score_candidate(req_text, profile_to_text(c))
        highlights = build_highlights(
            {"city": user.city, "personality_tags": user.personality_tags or []},
            {"city": c.city, "life_goals": c.life_goals, "personality_tags": c.personality_tags or []}
        )
        uc = UserCandidate(user_id=user.id, candidate_id=c.id, score=score, highlights=highlights)
        db.add(uc)
        results.append(uc)
    await db.commit()
    return sorted(results, key=lambda x: x.score, reverse=True)[:20]
```

- [ ] Run: `pytest tests/test_pool.py` → PASS
- [ ] `git commit -m "feat: pool curation with Claude Haiku scoring"`

---

### Task 8: Approach API

**Files:** `backend/services/approach_writer.py`, `backend/api/approaches.py`

- [ ] Write `tests/test_approaches.py`:
```python
@pytest.mark.asyncio
async def test_draft_message_is_short(mock_anthropic):
    from services.approach_writer import draft_approach_message
    msg = await draft_approach_message("喜欢爬山的工程师", "也喜欢户外，成都人", "standard")
    assert len(msg) <= 150

@pytest.mark.asyncio
async def test_approach_creates_record(client, auth_headers, seed_candidate):
    resp = await client.post("/api/approaches/draft", json={
        "candidate_id": seed_candidate.id, "tier": "standard"
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert "ai_message" in resp.json()
```

- [ ] Create `backend/services/approach_writer.py`:
```python
import anthropic
from app_config import settings

anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

TIER_INSTRUCTIONS = {
    "standard": "生成一条自然、温暖的开场白（不超过80字）。",
    "personalized": "生成一条更个性化、有细节的开场白（不超过120字），要引用对方画像中的至少一个具体细节。",
    "premium": "生成一条精心设计的开场白（不超过150字），引用具体细节，语气真诚，有记忆点。",
}

async def draft_approach_message(initiator_summary: str, candidate_summary: str, tier: str) -> str:
    instruction = TIER_INSTRUCTIONS.get(tier, TIER_INSTRUCTIONS["standard"])
    prompt = f"""你是一个帮助人们建立真实连接的助手。
发起人画像：{initiator_summary}
对方画像：{candidate_summary}
任务：{instruction}
要求：不要用"你好"开头，不要夸张，像一个真实的人说话。
只输出开场白本身，不要任何解释。"""
    resp = await anthropic_client.messages.create(
        model=settings.sonnet_model,
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
        timeout=15.0
    )
    return resp.content[0].text.strip()[:150]
```

- [ ] Create `backend/api/approaches.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from db.session import get_db
from db.models import User, Approach, Match
from api.auth import get_current_user
from services.approach_writer import draft_approach_message
from services.pool_curator import profile_to_text, requirements_to_text
from models.schemas import ApproachRequest
from app_config import settings

router = APIRouter()

@router.post("/draft")
async def draft_approach(
    req: ApproachRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Draft an AI message. Does NOT create an Approach yet (user must confirm)."""
    await _check_rate_limit(current_user.id, db)
    candidate = await db.get(User, req.candidate_id)
    if not candidate or candidate.deleted_at:
        raise HTTPException(404, "Candidate not found")
    msg = await draft_approach_message(
        profile_to_text(current_user), profile_to_text(candidate), req.tier
    )
    return {"ai_message": msg, "candidate_id": req.candidate_id, "tier": req.tier}

@router.post("/send")
async def send_approach(
    req: ApproachRequest,
    confirmed_message: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create Approach after user confirms the message. Payment stubbed."""
    await _check_rate_limit(current_user.id, db)
    approach = Approach(
        initiator_id=current_user.id,
        receiver_id=req.candidate_id,
        tier=req.tier,
        ai_message=confirmed_message[:150],
        status="pending"
    )
    db.add(approach)
    await db.commit()
    await db.refresh(approach)
    return {"approach_id": approach.id, "status": "pending"}

@router.patch("/{approach_id}/respond")
async def respond_to_approach(
    approach_id: str,
    response: str,  # accepted | declined
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    approach = await db.get(Approach, approach_id)
    if not approach or approach.receiver_id != current_user.id:
        raise HTTPException(404)
    if approach.status != "pending":
        raise HTTPException(400, "Approach already responded")
    approach.status = response
    approach.responded_at = datetime.utcnow()
    if response == "accepted":
        match = Match(
            user_a_id=approach.initiator_id,
            user_b_id=approach.receiver_id,
            approach_id=approach.id
        )
        db.add(match)
    await db.commit()
    return {"status": response}

@router.patch("/{approach_id}/rate")
async def rate_approach_quality(
    approach_id: str,
    rating: str,  # good | bad
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    approach = await db.get(Approach, approach_id)
    if not approach or approach.receiver_id != current_user.id:
        raise HTTPException(404)
    approach.quality_rating = rating
    await db.commit()
    return {"ok": True}

async def _check_rate_limit(user_id: str, db: AsyncSession):
    week_ago = datetime.utcnow() - timedelta(days=7)
    count_result = await db.execute(
        select(func.count()).select_from(Approach)
        .where(Approach.initiator_id == user_id)
        .where(Approach.created_at > week_ago)
    )
    count = count_result.scalar()
    if count >= settings.approach_weekly_limit:
        raise HTTPException(429, f"Weekly approach limit ({settings.approach_weekly_limit}) reached")
    # Cooldown check
    last = await db.execute(
        select(Approach).where(Approach.initiator_id == user_id)
        .order_by(Approach.created_at.desc()).limit(1)
    )
    last_approach = last.scalar_one_or_none()
    if last_approach:
        hours_since = (datetime.utcnow() - last_approach.created_at).total_seconds() / 3600
        if hours_since < settings.approach_cooldown_hours:
            remaining = settings.approach_cooldown_hours - hours_since
            raise HTTPException(429, f"Cooldown: {remaining:.1f}h remaining")
```

- [ ] Run: `pytest tests/test_approaches.py` → PASS
- [ ] `git commit -m "feat: approach draft/send/respond API with rate limiting"`

---

### Task 9: Session Guide API

**Files:** `backend/services/session_guide.py`, `backend/api/sessions.py`

- [ ] Write `tests/test_sessions.py`:
```python
@pytest.mark.asyncio
async def test_get_session_state_returns_question_index(client, auth_headers, seed_session):
    resp = await client.get(f"/api/sessions/{seed_session.id}/state", headers=auth_headers)
    assert resp.status_code == 200
    assert "current_question_index" in resp.json()

@pytest.mark.asyncio
async def test_advance_increments_question(client, auth_headers, seed_session):
    resp = await client.post(f"/api/sessions/{seed_session.id}/advance",
        json={"question_id": 1}, headers=auth_headers)
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_only_host_can_advance(client, non_host_headers, seed_session):
    resp = await client.post(f"/api/sessions/{seed_session.id}/advance",
        json={"question_id": 1}, headers=non_host_headers)
    assert resp.status_code == 403
```

- [ ] Create `backend/services/session_guide.py`:
```python
import redis.asyncio as aioredis
import json
from app_config import settings

async def get_redis():
    return aioredis.from_url(settings.redis_url)

async def get_session_state(session_id: str) -> dict:
    r = await get_redis()
    key = f"session:{session_id}:state"
    data = await r.get(key)
    if data:
        return json.loads(data)
    return {"current_question_index": 0, "questions_completed": []}

async def set_session_state(session_id: str, state: dict, ttl: int = 86400):
    r = await get_redis()
    key = f"session:{session_id}:state"
    await r.setex(key, ttl, json.dumps(state))

async def mark_question_completed(session_id: str, question_id: int) -> dict:
    state = await get_session_state(session_id)
    if question_id not in state["questions_completed"]:
        state["questions_completed"].append(question_id)
    state["current_question_index"] = max(state.get("current_question_index", 0),
                                           len(state["questions_completed"]))
    await set_session_state(session_id, state)
    return state
```

- [ ] Create `backend/api/sessions.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from db.session import get_db
from db.models import Match, Session as DBSession, User  # alias to avoid shadowing AsyncSession
from api.auth import get_current_user
from services.session_guide import get_session_state, mark_question_completed
from core.aron_questions import get_questions_for_round

router = APIRouter()

@router.post("")
async def create_session(
    match_id: str,
    session_type: str = "in_person",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    match = await db.get(Match, match_id)
    if not match or match.status != "active":
        raise HTTPException(404)
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    session = DBSession(
        match_id=match_id,
        round_number=match.current_round,
        session_type=session_type,
        host_user_id=match.user_a_id,  # approach initiator is host
        questions_completed=[]
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    questions = get_questions_for_round(match.current_round)
    return {"session_id": session.id, "questions": questions, "round": match.current_round}

@router.get("/{session_id}/state")
async def get_state(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    state = await get_session_state(session_id)
    questions = get_questions_for_round(session.round_number)
    current_q = questions[state["current_question_index"]] if state["current_question_index"] < len(questions) else None
    return {
        "session_id": session_id,
        "current_question_index": state["current_question_index"],
        "current_question": current_q,
        "questions_completed": state["questions_completed"],
        "round_number": session.round_number,
        "is_host": current_user.id == session.host_user_id,
        "session_type": session.session_type
    }

@router.post("/{session_id}/advance")
async def advance_question(
    session_id: str,
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(404)
    if current_user.id != session.host_user_id:
        raise HTTPException(403, "Only host can advance questions")
    state = await mark_question_completed(session_id, question_id)
    return {"questions_completed": state["questions_completed"], "current_question_index": state["current_question_index"]}

@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    rating: int,
    advance: bool,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    is_a = current_user.id == match.user_a_id
    if is_a:
        session.rating_a, session.advance_a = rating, advance
    else:
        session.rating_b, session.advance_b = rating, advance
    # If both have rated, finalize
    if session.advance_a is not None and session.advance_b is not None:
        session.completed_at = datetime.utcnow()
        state = await get_session_state(session_id)
        session.questions_completed = state["questions_completed"]
        if session.advance_a and session.advance_b:
            if match.current_round < 3:
                match.current_round += 1
        else:
            match.status = "closed"
    await db.commit()
    return {"ok": True, "both_rated": session.completed_at is not None}
```

- [ ] Run: `pytest tests/test_sessions.py` → PASS
- [ ] `git commit -m "feat: session guide API with Redis state sync"`

---

### Task 10: Offer API + Pipeline

**Files:** `backend/api/offers.py`, `backend/api/pipeline.py`

- [ ] Write `tests/test_offers.py`:
```python
@pytest.mark.asyncio
async def test_send_offer_creates_record(client, auth_headers, seed_match):
    resp = await client.post("/api/offers", json={"match_id": seed_match.id}, headers=auth_headers)
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_duplicate_offer_handled(client, auth_headers, seed_match_with_offer):
    resp = await client.post("/api/offers", json={"match_id": seed_match_with_offer.id}, headers=auth_headers)
    # Should auto-confirm (both sent offer)
    assert resp.status_code in (200, 409)
```

- [ ] Create `backend/api/offers.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from db.session import get_db
from db.models import Match, Offer, User
from api.auth import get_current_user
from models.schemas import OfferRespondRequest

router = APIRouter()

@router.post("")
async def send_offer(match_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    match = await db.get(Match, match_id)
    if not match or match.status not in ("active",):
        raise HTTPException(400, "Match not available for offer")
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    # Check for existing offer (race condition: auto-confirm)
    existing = await db.execute(select(Offer).where(Offer.match_id == match_id))
    existing_offer = existing.scalar_one_or_none()
    if existing_offer and existing_offer.sender_id != current_user.id:
        # Other party already sent offer → auto-confirm
        existing_offer.status = "accepted"
        existing_offer.responded_at = datetime.utcnow()
        match.status = "confirmed"
        await db.commit()
        return {"status": "confirmed", "message": "在一起！双方都想认真了。"}
    if existing_offer:
        raise HTTPException(409, "Offer already sent")
    offer = Offer(match_id=match_id, sender_id=current_user.id)
    match.status = "offer_pending"
    db.add(offer)
    await db.commit()
    return {"offer_id": offer.id, "status": "pending"}

@router.patch("/{offer_id}/respond")
async def respond_to_offer(
    offer_id: str, body: OfferRespondRequest,
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    offer = await db.get(Offer, offer_id)
    if not offer:
        raise HTTPException(404)
    match = await db.get(Match, offer.match_id)
    if current_user.id not in (match.user_a_id, match.user_b_id) or current_user.id == offer.sender_id:
        raise HTTPException(403)
    offer.status = body.response
    offer.responded_at = datetime.utcnow()
    if body.response == "accepted":
        match.status = "confirmed"
    elif body.response == "declined":
        match.status = "closed"
    await db.commit()
    return {"status": body.response}
```

- [ ] Create `backend/api/pipeline.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from db.session import get_db
from db.models import Match, User, Session
from api.auth import get_current_user

router = APIRouter()

@router.get("")
async def get_pipeline(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Match).where(
            or_(Match.user_a_id == current_user.id, Match.user_b_id == current_user.id)
        ).where(Match.status.in_(["active", "offer_pending", "confirmed"]))
        .order_by(Match.created_at.desc())
    )
    matches = result.scalars().all()
    pursuing, being_found = [], []
    for m in matches:
        is_initiator = m.user_a_id == current_user.id  # user_a = approach initiator
        other_id = m.user_b_id if is_initiator else m.user_a_id
        other = await db.get(User, other_id)
        entry = {
            "match_id": m.id, "round": m.current_round, "status": m.status,
            "other_city": other.city if other else None,
            "other_gender": other.gender if other else None,
            "other_personality_tags": other.personality_tags if other else [],
        }
        (pursuing if is_initiator else being_found).append(entry)
    return {"pursuing": pursuing, "being_found": being_found}
```

- [ ] Register all new routers in `main.py`
- [ ] Run: `pytest tests/` → all PASS
- [ ] `git commit -m "feat: offer API + pipeline view"`

---

## Phase 3 — Frontend

### Task 11: React Project Setup + Design Tokens

**Files:** `frontend/` (new project)

- [ ] Scaffold: `npm create vite@latest frontend -- --template react-ts && cd frontend && npm install`
- [ ] Install deps: `npm install -D tailwindcss autoprefixer && npx tailwindcss init -p`
- [ ] Install: `npm install swr react-router-dom`
- [ ] Create `frontend/src/styles/tokens.ts`:
```typescript
export const tokens = {
  colors: {
    bg: "#0D0D1A",
    bgCard: "#14142A",
    text: "#F0EDE8",
    textMuted: "#A09CA0",
    accent: "#C4956A",
    accentHover: "#D4A57A",
    border: "#2A2A4A",
    gridLine: "rgba(255,255,255,0.06)",
    success: "#4CAF82",
    warning: "#E8A87C",
  },
  fonts: {
    mono: "'IBM Plex Mono', 'Courier New', monospace",
    body: "'IBM Plex Mono', monospace",
  },
};
```

- [ ] Create `frontend/src/styles/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0D0D1A;
  --bg-card: #14142A;
  --text: #F0EDE8;
  --text-muted: #A09CA0;
  --accent: #C4956A;
  --border: #2A2A4A;
}

body { background: var(--bg); color: var(--text); font-family: 'IBM Plex Mono', monospace; }

.pixel-border { border: 1px solid var(--border); }
.pixel-border:hover { border-color: var(--accent); }

/* Pixel grid background */
.pixel-grid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Typewriter animation */
@keyframes typewriter { from { width: 0; } to { width: 100%; } }
.typewriter { overflow: hidden; white-space: nowrap; animation: typewriter 0.8s steps(40) forwards; }

/* Pixel button press */
.pixel-btn:active { transform: translateY(1px); }
```

- [ ] Configure `tailwind.config.ts` to use CSS variables
- [ ] `git commit -m "feat: frontend scaffold with pixel design tokens"`

---

### Task 12: Pixel Avatar Component

**Files:** `frontend/src/components/ui/PixelAvatar.tsx`

- [ ] Create `frontend/src/components/ui/PixelAvatar.tsx`:
```typescript
import React, { useMemo } from "react";

interface Props {
  userId: string;
  size?: number; // grid cells (default 8)
  pixelSize?: number; // px per cell (default 8)
}

// Deterministic color palette from userId hash
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

const PALETTES = [
  ["#C4956A", "#8B6A8B", "#4A6A8B"],
  ["#8B4A6A", "#6A8B4A", "#C4A06A"],
  ["#4A8B8B", "#8B8B4A", "#6A4A8B"],
  ["#C46A8B", "#6A8BC4", "#8BC46A"],
];

// Simple symmetrical pixel face pattern (8x8 grid, mirrored)
const FACE_TEMPLATES = [
  [0,0,1,1,1,1,0,0,
   0,1,0,0,0,0,1,0,
   1,0,1,0,0,1,0,1,
   1,0,0,0,0,0,0,1,
   1,0,1,0,0,1,0,1,
   1,0,0,1,1,0,0,1,
   0,1,0,0,0,0,1,0,
   0,0,1,1,1,1,0,0],
  [0,1,1,0,0,1,1,0,
   1,0,0,1,1,0,0,1,
   1,0,1,0,0,1,0,1,
   1,0,0,0,0,0,0,1,
   1,0,1,1,1,1,0,1,
   1,0,0,0,0,0,0,1,
   0,1,0,0,0,0,1,0,
   0,0,1,1,1,1,0,0],
];

export function PixelAvatar({ userId, size = 8, pixelSize = 8 }: Props) {
  const { palette, template } = useMemo(() => {
    const h = hashCode(userId);
    const palette = PALETTES[h % PALETTES.length];
    const template = FACE_TEMPLATES[Math.floor(h / PALETTES.length) % FACE_TEMPLATES.length];
    return { palette, template };
  }, [userId]);

  const totalSize = size * pixelSize;

  return (
    <div style={{ width: totalSize, height: totalSize, display: "grid", gridTemplateColumns: `repeat(${size}, ${pixelSize}px)` }}>
      {template.slice(0, size * size).map((on, i) => (
        <div
          key={i}
          style={{
            width: pixelSize,
            height: pixelSize,
            backgroundColor: on ? palette[i % palette.length] : "transparent",
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] Add test: create `frontend/src/components/ui/PixelAvatar.test.tsx`:
```typescript
import { render } from "@testing-library/react";
import { PixelAvatar } from "./PixelAvatar";

test("renders without crash", () => {
  const { container } = render(<PixelAvatar userId="test-123" />);
  expect(container.firstChild).toBeTruthy();
});

test("same userId produces same output", () => {
  const { container: a } = render(<PixelAvatar userId="abc" />);
  const { container: b } = render(<PixelAvatar userId="abc" />);
  expect(a.innerHTML).toBe(b.innerHTML);
});
```

- [ ] Run: `npm test` → PASS
- [ ] `git commit -m "feat: deterministic PixelAvatar component"`

---

### Task 13: API Client + Auth Hook

**Files:** `frontend/src/services/api.ts`, `frontend/src/hooks/useAuth.ts`

- [ ] Create `frontend/src/services/api.ts`:
```typescript
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${resp.status}`);
  }
  return resp.json();
}

export const api = {
  sendOtp: (phone: string) => apiFetch("/api/auth/send-otp", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string) => apiFetch<{ token: string; user_id: string; is_new: boolean }>("/api/auth/verify", { method: "POST", body: JSON.stringify({ phone, otp }) }),
  getProfile: () => apiFetch("/api/profile"),
  updateProfile: (data: object) => apiFetch("/api/profile", { method: "PUT", body: JSON.stringify(data) }),
  getPool: () => apiFetch<any[]>("/api/pool"),
  draftApproach: (candidate_id: string, tier: string) => apiFetch("/api/approaches/draft", { method: "POST", body: JSON.stringify({ candidate_id, tier }) }),
  sendApproach: (candidate_id: string, tier: string, confirmed_message: string) => apiFetch("/api/approaches/send", { method: "POST", body: JSON.stringify({ candidate_id, tier, confirmed_message }) }),
  respondApproach: (id: string, response: string) => apiFetch(`/api/approaches/${id}/respond`, { method: "PATCH", body: JSON.stringify({ response }) }),
  getPipeline: () => apiFetch("/api/pipeline"),
  createSession: (match_id: string, session_type = "in_person") => apiFetch("/api/sessions", { method: "POST", body: JSON.stringify({ match_id, session_type }) }),
  getSessionState: (id: string) => apiFetch(`/api/sessions/${id}/state`),
  advanceQuestion: (id: string, question_id: number) => apiFetch(`/api/sessions/${id}/advance`, { method: "POST", body: JSON.stringify({ question_id }) }),
  endSession: (id: string, rating: number, advance: boolean) => apiFetch(`/api/sessions/${id}/end`, { method: "POST", body: JSON.stringify({ rating, advance }) }),
  sendOffer: (match_id: string) => apiFetch("/api/offers", { method: "POST", body: JSON.stringify({ match_id }) }),
  respondOffer: (id: string, response: string) => apiFetch(`/api/offers/${id}/respond`, { method: "PATCH", body: JSON.stringify({ response }) }),
};
```

- [ ] Create `frontend/src/hooks/useAuth.ts`:
```typescript
import { useState, useEffect } from "react";
import { api } from "../services/api";

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isNew, setIsNew] = useState(false);

  const login = async (phone: string, otp: string) => {
    const result = await api.verifyOtp(phone, otp);
    localStorage.setItem("token", result.token);
    setToken(result.token);
    setIsNew(result.is_new);
    return result;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return { token, isNew, login, logout, isAuthenticated: !!token };
}
```

- [ ] `git commit -m "feat: typed API client and auth hook"`

---

### Task 14: Core Pages

**Files:** `Pool/index.tsx`, `Pipeline/index.tsx`, `Session/index.tsx`

- [ ] Create `frontend/src/pages/Pool/index.tsx`:
```typescript
import { useState } from "react";
import useSWR from "swr";
import { api } from "../../services/api";
import { PixelAvatar } from "../../components/ui/PixelAvatar";

export function PoolPage() {
  const { data: candidates, isLoading } = useSWR("/pool", api.getPool);
  const [approachTarget, setApproachTarget] = useState<any>(null);
  const [draft, setDraft] = useState<string>("");
  const [tier, setTier] = useState("standard");
  const TIER_PRICE = { standard: "¥19", personalized: "¥39", premium: "¥69" };

  const handleDraft = async (candidate: any) => {
    setApproachTarget(candidate);
    const result = await api.draftApproach(candidate.candidate_id, tier);
    setDraft(result.ai_message);
  };

  const handleSend = async () => {
    if (!approachTarget) return;
    await api.sendApproach(approachTarget.candidate_id, tier, draft);
    setApproachTarget(null);
    setDraft("");
  };

  if (isLoading) return <div className="pixel-grid min-h-screen flex items-center justify-center text-[--text-muted]">加载候选人池...</div>;

  return (
    <div className="pixel-grid min-h-screen p-4">
      <h1 className="text-[--accent] font-mono text-lg mb-6">候选人池</h1>
      <div className="grid gap-3">
        {candidates?.map((c: any) => (
          <div key={c.candidate_id} className="pixel-border bg-[--bg-card] p-4 flex items-center gap-4">
            <PixelAvatar userId={c.candidate_id} pixelSize={6} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[--text-muted] text-xs">{c.city} · {c.age}岁</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-2 h-2" style={{ background: i < Math.round(c.score / 10) ? "var(--accent)" : "var(--border)" }} />
                  ))}
                </div>
                <span className="text-[--accent] text-xs font-mono">{c.score}</span>
              </div>
              <div className="text-xs text-[--text-muted] space-y-0.5">
                {c.highlights?.map((h: string, i: number) => <div key={i}>· {h}</div>)}
              </div>
            </div>
            <button onClick={() => handleDraft(c)} className="pixel-btn pixel-border px-3 py-1.5 text-xs text-[--accent] hover:bg-[--accent] hover:text-[--bg] transition-colors">
              联系TA
            </button>
          </div>
        ))}
      </div>

      {approachTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[--bg-card] pixel-border p-6 max-w-sm w-full">
            <h2 className="text-[--accent] mb-4 font-mono">AI 帮你开场</h2>
            <div className="flex gap-2 mb-4">
              {(["standard", "personalized", "premium"] as const).map(t => (
                <button key={t} onClick={() => setTier(t)}
                  className={`pixel-btn pixel-border px-2 py-1 text-xs ${tier === t ? "bg-[--accent] text-[--bg]" : "text-[--text-muted]"}`}>
                  {TIER_PRICE[t]}
                </button>
              ))}
            </div>
            <textarea value={draft} onChange={e => setDraft(e.target.value)}
              className="w-full bg-[--bg] pixel-border p-3 text-sm font-mono text-[--text] resize-none h-24 mb-4" maxLength={150} />
            <div className="flex gap-2">
              <button onClick={() => setApproachTarget(null)} className="pixel-btn pixel-border px-4 py-2 text-xs text-[--text-muted] flex-1">取消</button>
              <button onClick={handleSend} className="pixel-btn bg-[--accent] px-4 py-2 text-xs text-[--bg] flex-1">确认发送</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] Create `frontend/src/pages/Session/index.tsx` (question guide with polling):
```typescript
import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";

interface Props { sessionId: string; }

export function SessionPage({ sessionId }: Props) {
  const [state, setState] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const fetchState = useCallback(async () => {
    const s = await api.getSessionState(sessionId);
    setState(s);
  }, [sessionId]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000); // poll every 3s
    return () => clearInterval(interval);
  }, [fetchState]);

  const advance = async () => {
    if (!state?.current_question) return;
    await api.advanceQuestion(sessionId, state.current_question.id);
    await fetchState();
  };

  const endSession = async (advance: boolean) => {
    await api.endSession(sessionId, rating, advance);
  };

  if (!state) return <div className="pixel-grid min-h-screen flex items-center justify-center">加载中...</div>;

  const q = state.current_question;
  const progress = state.questions_completed.length;
  const total = 12; // Round 1

  return (
    <div className="pixel-grid min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="h-1.5 flex-1" style={{ background: i < progress ? "var(--accent)" : "var(--border)" }} />
          ))}
        </div>

        {/* Question card */}
        {q ? (
          <div className="pixel-border bg-[--bg-card] p-6 mb-6">
            <div className="text-[--text-muted] text-xs mb-3 font-mono">Q{q.id} / 问题 {progress + 1}</div>
            <p className="text-[--text] text-base leading-relaxed typewriter">{q.zh}</p>
          </div>
        ) : (
          <div className="pixel-border bg-[--bg-card] p-6 mb-6 text-center text-[--text-muted]">
            本轮问题已全部聊完 ✦
          </div>
        )}

        {/* Controls */}
        {state.is_host && q && (
          <button onClick={advance} className="pixel-btn w-full bg-[--accent] text-[--bg] py-3 font-mono text-sm mb-3">
            下一题 →
          </button>
        )}
        <button onClick={() => setShowRating(true)} className="pixel-btn w-full pixel-border text-[--text-muted] py-2 font-mono text-sm">
          结束今天
        </button>
      </div>

      {showRating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[--bg-card] pixel-border p-6 max-w-xs w-full">
            <h2 className="text-[--accent] mb-4 font-mono text-center">今天聊得怎么样？</h2>
            <div className="flex justify-center gap-2 mb-6">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  className={`w-10 h-10 pixel-border font-mono text-sm ${rating >= n ? "bg-[--accent] text-[--bg]" : "text-[--text-muted]"}`}>
                  {n}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => endSession(false)} className="pixel-btn flex-1 pixel-border py-2 text-xs text-[--text-muted]">暂时到这里</button>
              <button onClick={() => endSession(true)} className="pixel-btn flex-1 bg-[--accent] py-2 text-xs text-[--bg]">继续深聊</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] Create `frontend/src/App.tsx` with React Router, auth guard, and all page routes
- [ ] `git commit -m "feat: Pool, Pipeline, Session pages with pixel design"`

---

## Phase 4 — Background Jobs (Enhancement, separate cycle)

> These tasks can be executed independently after Phase 3 is validated.

### Task 15: ARQ Worker + Nightly Recap

**Files:** `backend/workers/arq_worker.py`, `backend/services/recap_generator.py`

- [ ] Install ARQ: `pip install arq`
- [ ] Create `backend/services/recap_generator.py`:
```python
import anthropic
from app_config import settings
from core.aron_questions import get_question

anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

async def generate_recap(questions_completed: list[int], round_number: int, perspective: str = "neutral") -> str:
    question_texts = [get_question(qid)["zh"] for qid in questions_completed if get_question(qid)]
    prompt = f"""你是一个温暖的关系见证者。两个人今天在约会中聊到了这些问题（第{round_number}次见面）：
{chr(10).join(f'- {t}' for t in question_texts)}

请用温暖、简洁的语气（不超过100字）写一段给其中一方的私人小结，
提炼今天聊到的主题，并建议下次可以从哪个问题继续深入。
不要提及对方名字。只输出小结本身。"""
    resp = await anthropic_client.messages.create(
        model=settings.sonnet_model, max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.content[0].text.strip()
```

- [ ] Create `backend/workers/arq_worker.py`:
```python
import asyncio
from arq.connections import RedisSettings
from app_config import settings
from db.session import AsyncSessionLocal
from db.models import Session as SessionModel, UserCandidate, User
from services.pool_curator import score_candidate, build_highlights, profile_to_text, requirements_to_text
from services.recap_generator import generate_recap
from sqlalchemy import select
from datetime import datetime

async def compute_pool_scores(ctx, user_id: str):
    """Background task: score all candidates for a user and cache to DB."""
    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        if not user: return
        candidates = (await db.execute(
            select(User).where(User.id != user_id).where(User.visibility == "active")
            .where(User.deleted_at.is_(None)).limit(100)
        )).scalars().all()
        req_text = requirements_to_text(user)
        sem = asyncio.Semaphore(5)
        async def score_one(c):
            async with sem:
                score = await score_candidate(req_text, profile_to_text(c))
                highlights = build_highlights(
                    {"city": user.city, "personality_tags": user.personality_tags or []},
                    {"city": c.city, "life_goals": c.life_goals, "personality_tags": c.personality_tags or []}
                )
                return UserCandidate(user_id=user_id, candidate_id=c.id, score=score, highlights=highlights)
        results = await asyncio.gather(*[score_one(c) for c in candidates])
        for r in results:
            db.add(r)
        await db.commit()

async def nightly_recap_batch(ctx):
    """Run at 02:00 CST. Generate recaps for all sessions completed today without one."""
    async with AsyncSessionLocal() as db:
        sessions = (await db.execute(
            select(SessionModel)
            .where(SessionModel.completed_at.is_not(None))
            .where(SessionModel.ai_recap.is_(None))
        )).scalars().all()
        sem = asyncio.Semaphore(5)
        async def recap_one(s):
            async with sem:
                recap = await generate_recap(s.questions_completed or [], s.round_number)
                s.ai_recap = recap
        await asyncio.gather(*[recap_one(s) for s in sessions])
        await db.commit()

class WorkerSettings:
    functions = [compute_pool_scores, nightly_recap_batch]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [
        # nightly_recap at 02:00 UTC+8 = 18:00 UTC
        {"coroutine": nightly_recap_batch, "hour": 18, "minute": 0}
    ]
```

- [ ] Run worker: `arq workers.arq_worker.WorkerSettings`
- [ ] `git commit -m "feat: ARQ background worker with pool scoring + nightly recap"`

---

## Completion Checklist

- [ ] All `pytest tests/` pass
- [ ] `npm test` passes in frontend
- [ ] Manual end-to-end: register → profile → view pool → draft approach → send → accept → create session → advance questions → end session → send offer → confirm
- [ ] Pixel avatar renders correctly for multiple user IDs
- [ ] Session polling updates within 3s on non-host phone
- [ ] `git tag v0.1.0-mvp`
