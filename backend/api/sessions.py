"""Session guide endpoints: create, get state, advance question, end session."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from core.aron_questions import get_questions_for_round
from db.models import Match
from db.models import Session as DBSession  # alias to avoid shadowing AsyncSession
from db.models import User
from db.session import get_db
from services.session_guide import get_session_state, mark_question_completed

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
    session = DBSession(
        match_id=match_id,
        round_number=match.current_round,
        session_type=session_type,
        host_user_id=match.user_a_id,  # approach initiator is always host
        questions_completed=[],
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
    db: AsyncSession = Depends(get_db),
):
    session = await db.get(DBSession, session_id)  # use DBSession alias
    if not session:
        raise HTTPException(404)
    match = await db.get(Match, session.match_id)
    if not match or current_user.id not in (match.user_a_id, match.user_b_id):
        raise HTTPException(403)
    state = await get_session_state(session_id)
    questions = get_questions_for_round(session.round_number)
    idx = state["current_question_index"]
    current_q = questions[idx] if idx < len(questions) else None
    return {
        "session_id": session_id,
        "current_question_index": idx,
        "current_question": current_q,
        "questions_completed": state["questions_completed"],
        "round_number": session.round_number,
        "is_host": current_user.id == session.host_user_id,
        "session_type": session.session_type,
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
