def test_settings_loads():
    from app_config import settings
    assert settings.approach_weekly_limit == 3
    assert settings.pool_cache_ttl_seconds == 21600

def test_settings_has_model_names():
    from app_config import settings
    assert "haiku" in settings.haiku_model
    assert "sonnet" in settings.sonnet_model
