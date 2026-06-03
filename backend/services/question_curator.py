"""AI question curation: select 5 best questions per session based on both profiles."""

import logging
import random

from app_config import settings
from core.aron_questions import get_questions_for_round

logger = logging.getLogger(__name__)

MAX_SELECTED = 5
MAX_SWAPS = 3


def _build_curation_prompt(round_number: int, questions: list[dict], profile_a: dict, profile_b: dict) -> str:
    q_list = "\n".join(f"  Q{q['id']}: {q['localized_zh']}" for q in questions)
    return f"""You are a dating conversation curator for a structured dating app.

Two people are about to have their Round {round_number} conversation. Based on their profiles, select the 5 best questions from the pool below. Order them from lightest/most fun to deepest/most vulnerable.

Person A profile:
- City: {profile_a.get('city', 'unknown')}
- Personality: {', '.join(profile_a.get('personality_tags') or [])}
- Life goals: {profile_a.get('life_goals', '')}
- Interests: {profile_a.get('work', '')}

Person B profile:
- City: {profile_b.get('city', 'unknown')}
- Personality: {', '.join(profile_b.get('personality_tags') or [])}
- Life goals: {profile_b.get('life_goals', '')}
- Interests: {profile_b.get('work', '')}

Available questions:
{q_list}

Return ONLY a JSON array of 5 question IDs, ordered from lightest to deepest. Example: [4, 1, 9, 7, 11]
No explanation, just the JSON array."""


async def curate_questions(
    round_number: int,
    profile_a: dict,
    profile_b: dict,
    exclude_ids: list[int] | None = None,
) -> list[int]:
    """Select 5 questions from the round's pool using Claude API. Falls back to random."""
    pool = get_questions_for_round(round_number)
    if exclude_ids:
        pool = [q for q in pool if q["id"] not in exclude_ids]

    # Fallback: random selection
    if not settings.anthropic_api_key or len(pool) <= MAX_SELECTED:
        ids = [q["id"] for q in pool]
        random.shuffle(ids)
        return ids[:MAX_SELECTED]

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        prompt = _build_curation_prompt(round_number, pool, profile_a, profile_b)
        resp = await client.messages.create(
            model=settings.haiku_model,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}],
        )
        import json
        text = resp.content[0].text.strip()
        # Extract JSON array from response
        if "[" in text:
            text = text[text.index("["):text.rindex("]") + 1]
        selected = json.loads(text)
        # Validate: must be ints from the pool
        valid_ids = {q["id"] for q in pool}
        selected = [qid for qid in selected if qid in valid_ids][:MAX_SELECTED]
        if len(selected) < MAX_SELECTED:
            # Fill remaining from pool
            remaining = [q["id"] for q in pool if q["id"] not in selected]
            random.shuffle(remaining)
            selected.extend(remaining[:MAX_SELECTED - len(selected)])
        return selected
    except Exception as e:
        logger.warning("AI curation failed, falling back to random: %s", e)
        ids = [q["id"] for q in pool]
        random.shuffle(ids)
        return ids[:MAX_SELECTED]


def pick_swap_question(round_number: int, current_ids: list[int]) -> int | None:
    """Pick one random question from the remaining pool (not in current_ids)."""
    pool = get_questions_for_round(round_number)
    remaining = [q["id"] for q in pool if q["id"] not in current_ids]
    if not remaining:
        return None
    return random.choice(remaining)
