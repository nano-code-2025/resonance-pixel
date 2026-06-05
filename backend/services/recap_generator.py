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


async def generate_recap_from_answers(
    paired_answers: list[dict], round_number: int
) -> str:
    """Generate recap from actual paired answers using Haiku (cheaper, faster).

    Each item in paired_answers: {question_text, answer_a, answer_b}
    """
    if not paired_answers:
        return "今天的对话很特别，值得好好回味。"

    lines = []
    for qa in paired_answers:
        lines.append(f"问题：{qa['question_text']}")
        lines.append(f"  A的回答：{qa['answer_a']}")
        lines.append(f"  B的回答：{qa['answer_b']}")

    prompt = (
        f"你是一个温暖的关系见证者。两个人在第{round_number}次见面中的对话：\n"
        + "\n".join(lines)
        + "\n\n请用温暖、简洁的语气（不超过150字）写一段私人小结。"
        "提炼他们聊到的主题和共鸣点，指出有趣的差异。"
        "不要提及对方名字或A/B。只输出小结本身。"
    )
    resp = await anthropic_client.messages.create(
        model=settings.haiku_model,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text.strip()[:2000]
