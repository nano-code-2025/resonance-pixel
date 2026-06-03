from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:pass@localhost/resonance"
    redis_url: str = "redis://localhost:6379"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_minutes: int = 60 * 24 * 7
    anthropic_api_key: str = ""
    haiku_model: str = "claude-haiku-4-5-20251001"
    sonnet_model: str = "claude-sonnet-4-6"
    # Tencent Cloud SMS
    tencent_secret_id: str = ""
    tencent_secret_key: str = ""
    sms_sdk_app_id: str = ""
    sms_sign_name: str = ""
    sms_template_id: str = ""
    # Feishu (飞书)
    feishu_app_id: str = ""
    feishu_app_secret: str = ""
    # Tencent COS
    cos_secret_id: str = ""
    cos_secret_key: str = ""
    cos_bucket: str = ""
    cos_region: str = "ap-chengdu"
    otp_ttl_seconds: int = 300
    approach_weekly_limit: int = 3
    approach_cooldown_hours: int = 48
    pool_cache_ttl_seconds: int = 21600  # 6h

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
