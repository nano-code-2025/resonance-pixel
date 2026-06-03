"""
Tencent Cloud SMS service (腾讯云短信).

When TENCENT_SECRET_ID / SMS_SDK_APP_ID are not configured, falls back to
printing the OTP to stdout so local dev still works without credentials.
"""
import logging
from app_config import settings

logger = logging.getLogger(__name__)


def _is_configured() -> bool:
    return bool(settings.tencent_secret_id and settings.sms_sdk_app_id)


async def send_otp_sms(phone: str, otp: str) -> None:
    """Send OTP via SMS. Falls back to stdout when credentials are absent."""
    if not _is_configured():
        logger.warning("[SMS-STUB] OTP for %s: %s (set TENCENT_SECRET_ID to enable real SMS)", phone, otp)
        print(f"[OTP] {phone}: {otp}")
        return

    try:
        from tencentcloud.common import credential
        from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
        from tencentcloud.sms.v20210111 import sms_client, models

        cred = credential.Credential(settings.tencent_secret_id, settings.tencent_secret_key)
        client = sms_client.SmsClient(cred, "ap-guangzhou")

        req = models.SendSmsRequest()
        req.SmsSdkAppId = settings.sms_sdk_app_id
        req.SignName = settings.sms_sign_name
        req.TemplateId = settings.sms_template_id
        req.TemplateParamSet = [otp]
        req.PhoneNumberSet = [f"+86{phone}"]

        resp = client.SendSms(req)
        status = resp.SendStatusSet[0] if resp.SendStatusSet else None
        if status and status.Code != "Ok":
            raise RuntimeError(f"SMS send failed: {status.Code} {status.Message}")

        logger.info("OTP sent to %s via Tencent SMS", phone)

    except TencentCloudSDKException as e:
        logger.error("Tencent SMS SDK error: %s", e)
        raise RuntimeError("SMS service unavailable") from e
