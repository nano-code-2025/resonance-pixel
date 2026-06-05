def test_classify_romantic():
    """High overlap tags = romantic bucket."""
    from services.bloom_assigner import classify_compatibility
    result = classify_compatibility(
        tags_a=["内向", "爱阅读", "温柔"],
        tags_b=["内向", "爱阅读", "独立"],
        goals_a="", goals_b="",
    )
    assert result == "romantic"


def test_classify_adventurous():
    """Both have adventure tags = adventurous (internal) -> tropical (API)."""
    from services.bloom_assigner import classify_compatibility, compatibility_bucket_for_api
    internal = classify_compatibility(
        tags_a=["热爱旅行", "外向"],
        tags_b=["热爱旅行", "活泼"],
        goals_a="", goals_b="",
    )
    assert internal == "adventurous"
    assert compatibility_bucket_for_api(internal) == "tropical"


def test_classify_default():
    """Empty tags = romantic (default)."""
    from services.bloom_assigner import classify_compatibility
    result = classify_compatibility(
        tags_a=None, tags_b=None,
        goals_a=None, goals_b=None,
    )
    assert result == "romantic"


def test_bucket_api_mapping():
    """All internal buckets map to spec-defined API values."""
    from services.bloom_assigner import compatibility_bucket_for_api
    assert compatibility_bucket_for_api("romantic") == "romantic"
    assert compatibility_bucket_for_api("grounded") == "warm"
    assert compatibility_bucket_for_api("contrast") == "elegant"
    assert compatibility_bucket_for_api("adventurous") == "tropical"
    assert compatibility_bucket_for_api("curious") == "whimsical"
