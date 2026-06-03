import pytest
from services.auth_service import generate_otp, create_token, decode_token


def test_otp_is_6_digits():
    otp = generate_otp()
    assert len(otp) == 6 and otp.isdigit()


def test_token_roundtrip():
    token = create_token("user-123")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"


def test_invalid_token_raises():
    with pytest.raises(ValueError):
        decode_token("not-a-token")
