from core.aron_questions import QUESTIONS, get_questions_for_round, get_question

def test_36_questions_exist():
    assert len(QUESTIONS) == 36

def test_round_1_returns_12():
    qs = get_questions_for_round(1)
    assert len(qs) == 12

def test_round_2_returns_12():
    qs = get_questions_for_round(2)
    assert len(qs) == 12

def test_round_3_returns_12():
    qs = get_questions_for_round(3)
    assert len(qs) == 12

def test_each_question_has_zh():
    for q in QUESTIONS:
        assert q["zh"], f"Q{q['id']} missing zh"

def test_each_question_has_localized_zh():
    for q in QUESTIONS:
        assert q["localized_zh"], f"Q{q['id']} missing localized_zh"

def test_get_question_by_id():
    q = get_question(1)
    assert q is not None
    assert q["id"] == 1
    assert q["group"] == 1

def test_get_question_none_for_invalid():
    assert get_question(99) is None
