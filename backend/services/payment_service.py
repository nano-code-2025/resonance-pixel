"""
Payment stub for approach tiers.

In production, replace with WeChat Pay / Alipay SDK.
When PAY_PROVIDER is not configured, falls back to logging and returning a
fake payment_id so the rest of the flow works in dev.
"""
import logging
import uuid

logger = logging.getLogger(__name__)

TIER_PRICE_CNY = {
    "standard": 19,
    "personalized": 39,
    "premium": 69,
}


async def charge_approach(user_id: str, tier: str) -> str:
    """
    Charge the user for an approach tier.
    Returns a payment_id string on success; raises RuntimeError on failure.

    Stub: always succeeds in dev, logs the charge intent.
    """
    amount = TIER_PRICE_CNY.get(tier, 0)
    payment_id = f"stub_{uuid.uuid4().hex[:12]}"
    logger.warning(
        "[PAYMENT-STUB] user=%s tier=%s amount=¥%d payment_id=%s "
        "(set PAY_PROVIDER to enable real payment)",
        user_id, tier, amount, payment_id,
    )
    # TODO: integrate WeChat Pay / Alipay here
    return payment_id
