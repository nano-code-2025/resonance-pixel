# -*- coding: utf-8 -*-
"""AI approach message generation using Claude Sonnet."""

import anthropic
from app_config import settings

anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

TIER_INSTRUCTIONS: dict[str, str] = {
    "standard": "生成一条自然、温暖的开场白（不超过80字）。",
    "personalized": "生成一条更个性化、有细节的开场白（不超过120字），要引用对方画像中的至少一个具体细节。",
    "premium": "生成一条精心设计的开场白（不超过150字），引用具体细节，语气真诚，有记忆点。",
}


async def draft_approach_message(
    initiator_summary: str, candidate_summary: str, tier: str
) -> str:
    """Draft an approach message using Claude Sonnet. Returns at most 150 chars."""
    instruction = TIER_INSTRUCTIONS.get(tier, TIER_INSTRUCTIONS["standard"])
    prompt = (
        "你是一个帮助人们建立真实连接的助手。\n"
        f"发起人画像：{initiator_summary}\n"
        f"对方画像：{candidate_summary}\n"
        f"任务：{instruction}\n"
        "要求：不要用\"你好\"开头，不要夸张，像一个真实的人说话。\n"
        "只输出开场白本身，不要任何解释。"
    )
    resp = await anthropic_client.messages.create(
        model=settings.sonnet_model,
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
        timeout=15.0,
    )
    return resp.content[0].text.strip()[:150]
