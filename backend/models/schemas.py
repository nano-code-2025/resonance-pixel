from pydantic import BaseModel, Field
from typing import Literal
from enum import Enum


class Shichen(str, Enum):
    zi = "子"; chou = "丑"; yin = "寅"; mao = "卯"
    chen = "辰"; si = "巳"; wu = "午"; wei = "未"
    shen = "申"; you = "酉"; xu = "戌"; hai = "亥"
    unknown = "未知"  # 不知道出生时辰时使用


MBTI_TYPES = [
    'INTJ','INTP','ENTJ','ENTP',
    'INFJ','INFP','ENFJ','ENFP',
    'ISTJ','ISFJ','ESTJ','ESFJ',
    'ISTP','ISFP','ESTP','ESFP',
]


class QuestionnaireAnswers(BaseModel):
    q1: str = Field(description="感情节奏：fast/slow/natural")
    q2: str = Field(description="生活节奏：homebody/explorer/flexible")
    q3: str = Field(description="冲突处理：calm_later/talk_now/need_space")
    q4: str = Field(description="婚育态度：important/natural/not_now")
    q5: str = Field(description="安全感需求：understand/need_explain/hard_accept")
    q6: str = Field(description="爱的语言：time/words/acts/gifts")
    q7: str = Field(description="社交媒体习惯：never/sometimes/often")
    q8: str = Field(description="个人空间需求：very_important/neutral/like_together")
    q9: str = Field(description="决策方式：self_first/discuss/follow_partner")
    q10: list[str] = Field(
        description="核心价值观排序（从最重要到最不重要）",
        min_length=4, max_length=4,
        examples=[["growth", "companionship", "passion", "security"]]
    )


class ProfileRequest(BaseModel):
    birth_year: int = Field(ge=1950, le=2010)
    birth_month: int = Field(ge=1, le=12)
    birth_day: int = Field(ge=1, le=31)
    shichen: Shichen
    gender: Literal['M', 'F', 'other']
    mbti: str = Field(min_length=4, max_length=4)
    questionnaire: QuestionnaireAnswers
    bazi_mode: Literal['traditional', 'ai', 'both'] = 'both'


# --- 输出模型 ---

class BaziProfile(BaseModel):
    display: str              # "壬午 甲子 丁亥 庚申"
    day_master: str           # "壬"
    day_master_element: str   # "水"
    day_master_trait: str     # 传统性格描述
    element_count: dict[str, int]
    missing_elements: list[str]
    traditional_interpretation: str   # 传统解读文本
    ai_interpretation: str            # AI白话解读


class MbtiProfile(BaseModel):
    type: str
    description: str
    relationship_style: str


class RadarData(BaseModel):
    """前端雷达图数据，每项0-100"""
    bazi_score: float       # 命盘契合（个人档案中为五行平衡度）
    mbti_score: float       # MBTI开放度
    values_score: float     # 三观成熟度
    independence: float     # 独立性
    emotional_depth: float  # 情感深度


class UserProfile(BaseModel):
    bazi: BaziProfile
    mbti: MbtiProfile
    radar: RadarData
    summary: str            # AI生成的综合画像文字（200字内）


# --- 匹配相关 ---

class MatchScore(BaseModel):
    total: float            # 加权总分 0-100
    bazi_score: float
    mbti_score: float
    questionnaire_score: float
    zodiac_score: float
    highlights: list[str]   # 最强契合点
    cautions: list[str]     # 注意点
    icebreaker: str         # 破冰建议


# --- 个人档案相关 ---

class ProfileUpdate(BaseModel):
    age: int | None = None
    city: str | None = None
    gender: str | None = None
    education: str | None = None
    work: str | None = None
    life_goals: str | None = None
    personality_tags: list[str] | None = None
    requirements: dict | None = None
    enrichment: dict | None = None
    visibility: str | None = None


class ProfileResponse(BaseModel):
    id: str
    phone: str
    age: int | None = None
    city: str | None = None
    gender: str | None = None
    education: str | None = None
    work: str | None = None
    life_goals: str | None = None
    personality_tags: list[str] | None = None
    requirements: dict | None = None
    enrichment: dict | None = None
    visibility: str
    selfie_url: str | None = None
    is_complete: bool  # True when age, city, gender, requirements all set


class ApproachRequest(BaseModel):
    candidate_id: str
    tier: str = "standard"  # standard | personalized | premium


class ApproachResponse(BaseModel):
    id: str
    ai_message: str
    tier: str


class SessionStateResponse(BaseModel):
    session_id: str
    current_question_index: int
    questions_completed: list[int]
    round_number: int
    is_host: bool
    session_type: str


class OfferRequest(BaseModel):
    match_id: str


class OfferRespondRequest(BaseModel):
    response: str  # accepted | not_yet | declined
