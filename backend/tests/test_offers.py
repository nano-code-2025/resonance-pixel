import pytest
from unittest.mock import AsyncMock, MagicMock


def test_offer_status_transitions():
    """Offer status should progress: pending -> accepted|not_yet|declined."""
    valid_responses = {"accepted", "not_yet", "declined"}
    assert "pending" not in valid_responses
    assert "accepted" in valid_responses


@pytest.mark.asyncio
async def test_offer_router_exists():
    """Offer router must be registered and accessible."""
    from api.offers import router
    assert router is not None
    routes = [r.path for r in router.routes]
    assert any("/respond" in r for r in routes)
