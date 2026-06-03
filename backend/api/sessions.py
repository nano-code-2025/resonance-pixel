"""Session guide endpoints: create, get state, advance question, end session."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from core.aron_questions import get_question, get_questions_for_round
from db.models import Match
from db.models import QuestionAnswer
from db.models import Session as DBSession  # alias to avoid shadowing AsyncSession
from db.models import User
from db.session import get_db
from services.question_curator import MAX_SWAPS, curate_questions, pick_swap_question
from services.session_guide import get_session_state, mark_question_completed, skip_question

router = APIRouter()


@router.post("")
async def create_session(
    match_id: str,
    session_type: str = "in_person",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    match = await db.get(Match, match_id)
    if not match or match.status != "active":
        raise HTTPException(404, "Match not found or not active")
    if current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)

    # Load profiles for AI curation
    user_a = await db.get(User, match.user_a_id)
    user_b = await db.get(User, match.user_b_id)
    profile_a = {
        "city": user_a.city,
        "personality_tags": user_a.personality_tags,
        "life_goals": user_a.life_goals,
        "work": user_a.work,
    } if user_a else {}
    profile_b = {
        "city": user_b.city,
        "personality_tags": user_b.personality_tags,
        "life_goals": user_b.life_goals,
        "work": user_b.work,
    } if user_b else {}

    selected_ids = await curate_questions(
        round_number=match.current_round,
        profile_a=profile_a,
        profile_b=profile_b,
    )

    session = DBSession(
        match_id=match_id,
        round_number=match.current_round,
        session_type=session_type,
        host_user_id=match.user_a_id,  # approach initiator is always host
        questions_completed=[],
        selected_question_ids=selected_ids,
        swap_count=0,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    selected_questions = [get_question(qid) for qid in selected_ids]
    selected_questions = [q for q in selected_questions if q is not None]
    return {
        "session_id": session.id,
        "questions": selected_questions,
        "round": match.current_round,
    }


@router.get("/{session_id}/state")
async def get_state(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(DBSession, session_id)  # use DBSession alias
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if not match or current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    state = await get_session_state(session_id)

    # Use selected question IDs if available, fall back to full round questions
    if session.selected_question_ids:
        questions = [get_question(qid) for qid in session.selected_question_ids]
        questions = [q for q in questions if q is not None]
    else:
        questions = get_questions_for_round(session.round_number)

    idx = state["current_question_index"]
    current_q = questions[idx] if idx < len(questions) else None
    return {
        "session_id": session_id,
        "match_id": session.match_id,
        "current_question_index": idx,
        "current_question": current_q,
        "questions_completed": state["questions_completed"],
        "total_questions": len(questions),
        "round_number": session.round_number,
        "is_host": current_user.id == session.host_user_id,
        "session_type": session.session_type,
        "feishu_meeting_url": session.feishu_meeting_url,
        "swap_count": session.swap_count,
        "swaps_remaining": MAX_SWAPS - (session.swap_count or 0),
    }


@router.post("/{session_id}/advance")
async def advance_question(
    session_id: str,
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(DBSession, session_id)
    if not session:
        raise HTTPException(404)
    if current_user.id != session.host_user_id:
        raise HTTPException(403, "Only host can advance questions")
    state = await mark_question_completed(session_id, question_id)
    return {
        "questions_completed": state["questions_completed"],
        "current_question_index": state["current_question_index"],
    }


@router.post("/{session_id}/skip")
async def skip_current_question(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Host skips the current question (not added to completed list)."""
    session = await db.get(DBSession, session_id)
    if not session:
        raise HTTPException(404)
    if current_user.id != session.host_user_id:
        raise HTTPException(403, "Only host can skip questions")
    state = await skip_question(session_id)
    return {
        "questions_completed": state["questions_completed"],
        "current_question_index": state["current_question_index"],
    }


@router.post("/{session_id}/swap")
async def swap_question(
    session_id: str,
    question_index: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Swap the question at question_index with a random unused question from the pool."""
    session = await db.get(DBSession, session_id)
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if not match or current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)

    swap_count = session.swap_count or 0
    if swap_count >= MAX_SWAPS:
        raise HTTPException(400, f"Maximum {MAX_SWAPS} swaps allowed per session")

    current_ids = list(session.selected_question_ids or [])
    if question_index < 0 or question_index >= len(current_ids):
        raise HTTPException(400, "Invalid question index")

    new_id = pick_swap_question(session.round_number, current_ids)
    if new_id is None:
        raise HTTPException(400, "No more questions available to swap in")

    current_ids[question_index] = new_id
    session.selected_question_ids = current_ids
    session.swap_count = swap_count + 1
    await db.commit()

    new_question = get_question(new_id)
    return {
        "swapped_index": question_index,
        "new_question": new_question,
        "swap_count": session.swap_count,
        "swaps_remaining": MAX_SWAPS - session.swap_count,
        "selected_question_ids": current_ids,
    }


class AnswerRequest(BaseModel):
    question_id: int
    answer_text: str


@router.post("/{session_id}/answer")
async def save_answer(
    session_id: str,
    req: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a user's answer to a question in this session."""
    session = await db.get(DBSession, session_id)
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if not match or current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)

    if not req.answer_text or not req.answer_text.strip():
        raise HTTPException(400, "answer_text cannot be empty")
    if len(req.answer_text) > 500:
        raise HTTPException(400, "answer_text exceeds 500 characters")

    answer = QuestionAnswer(
        session_id=session_id,
        user_id=current_user.id,
        question_id=req.question_id,
        answer_text=req.answer_text.strip(),
    )
    db.add(answer)
    await db.commit()
    await db.refresh(answer)
    return {"answer_id": answer.id, "ok": True}


@router.get("/{session_id}/answers")
async def get_answers(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's answers for this session."""
    session = await db.get(DBSession, session_id)
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if not match or current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)

    result = await db.execute(
        select(QuestionAnswer).where(
            QuestionAnswer.session_id == session_id,
            QuestionAnswer.user_id == current_user.id,
        ).order_by(QuestionAnswer.created_at)
    )
    answers = result.scalars().all()
    return {
        "answers": [
            {
                "answer_id": a.id,
                "question_id": a.question_id,
                "answer_text": a.answer_text,
                "created_at": a.created_at.isoformat(),
            }
            for a in answers
        ]
    }


@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    rating: int,
    advance: bool,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(DBSession, session_id)
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if not match or current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    is_a = current_user.id == match.user_a_id
    if is_a:
        session.rating_a = rating
        session.advance_a = advance
    else:
        session.rating_b = rating
        session.advance_b = advance
    # Update last activity for bloom decay tracking
    match.last_activity_at = datetime.now(timezone.utc)
    # Finalize when both have rated
    if session.advance_a is not None and session.advance_b is not None:
        session.completed_at = datetime.now(timezone.utc)
        state = await get_session_state(session_id)
        session.questions_completed = state["questions_completed"]
        if session.advance_a and session.advance_b:
            if match.current_round < 3:
                match.current_round += 1
        else:
            match.status = "closed"
    await db.commit()
    return {"ok": True, "both_rated": session.completed_at is not None}
