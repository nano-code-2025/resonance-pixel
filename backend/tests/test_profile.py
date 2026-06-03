import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_update_profile(client, auth_headers, seed_user):
    resp = await client.put("/api/profile", json={
        "age": 28, "city": "成都", "gender": "F",
        "life_goals": "寻找真实的连接",
        "personality_tags": ["内向", "爱阅读"],
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["city"] == "成都"
    assert data["age"] == 28


@pytest.mark.asyncio
async def test_get_profile(client, auth_headers, seed_user):
    resp = await client.get("/api/profile", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "phone" in data
    assert "is_complete" in data


@pytest.mark.asyncio
async def test_get_profile_unauthenticated(client):
    resp = await client.get("/api/profile")
    assert resp.status_code == 403  # HTTPBearer returns 403 when no token
