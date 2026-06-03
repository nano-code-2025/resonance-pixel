"""AI-generated session recap using Claude Sonnet."""

import anthropic
from app_config import settings
from core.aron_questions import get_question

anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


async def generate_recap(questions_completed: list[int], round_number: int) -> str:
    """Generate a warm, personal recap of a completed dating session."""
    question_texts = [
        get_question(qid)["localized_zh"]
        for qid in questions_completed
        if get_question(qid)
    ]
    if not question_texts:
        return "今天的对话很特别，值得好好回味。"

    prompt = (
        f"你是一个温暖的关系见证者。两个人今天在约会中聊到了这些问题（第{round_number}次见面）：\n"
        + "\n".join(f"- {t}" for t in question_texts)
        + "\n\n请用温暖、简洁的语气（不超过100字）写一段给其中一方的私人小结，"
        "提炼今天聊到的主题，并建议下次可以从哪个问题继续深入。"
        "不要提及对方名字。只输出小结本身。"
    )
    resp = await anthropic_client.messages.create(
        model=settings.sonnet_model,
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text.strip()
