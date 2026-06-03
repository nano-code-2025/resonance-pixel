from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db.models import User
from models.schemas import ProfileUpdate, ProfileResponse
from api.auth import get_current_user
from services.cos_service import upload_selfie

router = APIRouter()


@router.get("", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return _to_response(current_user)


@router.put("", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return _to_response(current_user)


@router.post("/selfie", response_model=ProfileResponse)
async def upload_selfie_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content_type = file.content_type or ""
    data = await file.read()
    try:
        url = await upload_selfie(data, content_type, current_user.id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    current_user.selfie_url = url
    await db.commit()
    await db.refresh(current_user)
    return _to_response(current_user)


def _to_response(u: User) -> ProfileResponse:
    is_complete = all([u.age, u.city, u.gender, u.requirements])
    return ProfileResponse(
        id=u.id,
        phone=u.phone,
        age=u.age,
        city=u.city,
        gender=u.gender,
        life_goals=u.life_goals,
        personality_tags=u.personality_tags,
        requirements=u.requirements,
        enrichment=u.enrichment,
        visibility=u.visibility,
        selfie_url=u.selfie_url,
        is_complete=is_complete,
    )
