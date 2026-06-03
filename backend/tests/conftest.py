import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from db.models import Base, User, Approach, Match, Session as SessionModel
from db.session import get_db

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
    from main import app
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def seed_user(db) -> User:
    u = User(
        phone="13800000001", age=28, city="成都", gender="F",
        life_goals="寻找真实连接",
        personality_tags=["内向", "爱阅读"],
        requirements={"preferences": ["诚实"], "dealbreakers": []},
    )
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u


@pytest_asyncio.fixture
async def seed_candidate(db) -> User:
    u = User(
        phone="13800000002", age=30, city="成都", gender="M",
        life_goals="户外运动爱好者",
        personality_tags=["外向"],
    )
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u


@pytest.fixture
def auth_headers(seed_user) -> dict:
    from services.auth_service import create_token
    return {"Authorization": f"Bearer {create_token(seed_user.id)}"}


@pytest_asyncio.fixture
async def seed_match(db, seed_user, seed_candidate) -> Match:
    approach = Approach(
        initiator_id=seed_user.id,
        receiver_id=seed_candidate.id,
        tier="standard",
        status="accepted",
    )
    db.add(approach)
    await db.flush()
    match = Match(
        user_a_id=seed_user.id,
        user_b_id=seed_candidate.id,
        approach_id=approach.id,
    )
    db.add(match)
    await db.commit()
    await db.refresh(match)
    return match


@pytest_asyncio.fixture
async def seed_session(db, seed_match, seed_user) -> SessionModel:
    s = SessionModel(
        match_id=seed_match.id,
        round_number=1,
        host_user_id=seed_user.id,
        questions_completed=[],
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@pytest_asyncio.fixture
async def non_host_headers(seed_candidate) -> dict:
    from services.auth_service import create_token
    return {"Authorization": f"Bearer {create_token(seed_candidate.id)}"}
