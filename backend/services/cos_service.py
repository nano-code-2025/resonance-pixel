"""
Tencent COS upload service.

When COS_BUCKET / COS_SECRET_ID are not configured, returns a local placeholder
URL so onboarding still works in dev without cloud credentials.
"""
import logging
import uuid
from app_config import settings

logger = logging.getLogger(__name__)

_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def _is_configured() -> bool:
    return bool(settings.cos_bucket and settings.cos_secret_id)


async def upload_selfie(file_bytes: bytes, content_type: str, user_id: str) -> str:
    """
    Upload selfie to COS and return the public URL.
    Falls back to a local placeholder when credentials are absent.
    """
    if content_type not in _ALLOWED_MIME:
        raise ValueError(f"Unsupported image type: {content_type}")
    if len(file_bytes) > _MAX_BYTES:
        raise ValueError("Image too large (max 5 MB)")

    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    key = f"selfies/{user_id}/{uuid.uuid4().hex}.{ext}"

    if not _is_configured():
        logger.warning("[COS-STUB] Would upload %s bytes to %s", len(file_bytes), key)
        return f"https://placeholder.local/{key}"

    try:
        from qcloud_cos import CosConfig, CosS3Client

        config = CosConfig(
            Region=settings.cos_region,
            SecretId=settings.cos_secret_id,
            SecretKey=settings.cos_secret_key,
        )
        client = CosS3Client(config)
        client.put_object(
            Bucket=settings.cos_bucket,
            Body=file_bytes,
            Key=key,
            ContentType=content_type,
        )
        url = f"https://{settings.cos_bucket}.cos.{settings.cos_region}.myqcloud.com/{key}"
        logger.info("Uploaded selfie for user %s → %s", user_id, url)
        return url

    except Exception as e:
        logger.error("COS upload failed: %s", e)
        raise RuntimeError("Image upload failed") from e
