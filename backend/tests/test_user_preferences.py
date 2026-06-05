def test_user_preferences_default_none():
    """New user has preferences=None by default."""
    from db.models import User
    u = User(phone="13800009999")
    assert u.preferences is None


def test_user_preferences_accepts_dict():
    """User preferences accepts a dict value."""
    from db.models import User
    prefs = {"renderer": "svg", "theme": "parchment"}
    u = User(phone="13800009998", preferences=prefs)
    assert u.preferences["renderer"] == "svg"
    assert u.preferences["theme"] == "parchment"
