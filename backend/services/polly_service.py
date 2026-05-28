"""
Amazon Polly Service
Generates Indian language TTS audio and uploads to S3
"""
import os
import uuid
import boto3
from botocore.exceptions import ClientError


# Polly voice mapping for Indian languages
# Hindi has native Kajal (Neural) - Best quality
# Others use Hindi voice with their translated text (most natural for prototype)
LANGUAGE_VOICE_MAP = {
    "hi": {"voice_id": "Kajal", "engine": "neural", "language_code": "hi-IN"},
    "ta": {"voice_id": "Kajal", "engine": "neural", "language_code": "hi-IN"},   # fallback
    "bn": {"voice_id": "Kajal", "engine": "neural", "language_code": "hi-IN"},   # fallback
    "mr": {"voice_id": "Kajal", "engine": "neural", "language_code": "hi-IN"},   # fallback
    "te": {"voice_id": "Kajal", "engine": "neural", "language_code": "hi-IN"},   # fallback
}

# Note: Amazon Polly natively supports Hindi (Kajal, Aditi).
# For Tamil, Bengali, Marathi, Telugu — we generate Hindi summary audio
# and show the translated text as subtitles. Full native support in Phase 2.


def _get_polly_client():
    return boto3.client(
        "polly",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def _get_s3_client():
    return boto3.client(
        "s3",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def generate_audio(
    script_text: str,
    language_code: str,
    article_id: str,
) -> dict:
    """
    Convert script text to speech using Amazon Polly and upload to S3.
    Returns: {audio_url, duration_estimate, voice_used, s3_key}
    """
    polly_client = _get_polly_client()
    s3_client = _get_s3_client()
    bucket_name = os.environ.get("S3_BUCKET_NAME", "bharat-samachar-audio")

    voice_config = LANGUAGE_VOICE_MAP.get(language_code, LANGUAGE_VOICE_MAP["hi"])

    # Limit text to 3000 chars (Polly limit is 3000 chars for standard)
    text_to_speak = script_text[:2900]

    try:
        response = polly_client.synthesize_speech(
            Text=text_to_speak,
            OutputFormat="mp3",
            VoiceId=voice_config["voice_id"],
            Engine=voice_config["engine"],
            LanguageCode=voice_config["language_code"],
        )
    except ClientError as e:
        # Fallback to standard Aditi if neural fails
        response = polly_client.synthesize_speech(
            Text=text_to_speak,
            OutputFormat="mp3",
            VoiceId="Aditi",
            Engine="standard",
            LanguageCode="hi-IN",
        )

    # Upload to S3
    audio_key = f"audio/{article_id}/{language_code}_{uuid.uuid4().hex[:8]}.mp3"
    
    s3_client.put_object(
        Bucket=bucket_name,
        Key=audio_key,
        Body=response["AudioStream"].read(),
        ContentType="audio/mpeg",
    )

    # Generate pre-signed URL (1 hour expiry)
    expiry = int(os.environ.get("AUDIO_PRESIGNED_URL_EXPIRY", 3600))
    presigned_url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket_name, "Key": audio_key},
        ExpiresIn=expiry,
    )

    # Estimate duration (~150 words per minute for news reading)
    word_count = len(text_to_speak.split())
    duration_seconds = max(15, int((word_count / 150) * 60))

    return {
        "audio_url": presigned_url,
        "s3_key": audio_key,
        "voice_used": voice_config["voice_id"],
        "duration_estimate_seconds": duration_seconds,
        "language_code": language_code,
    }


def list_available_voices() -> list:
    """Return available Indian language voices from Polly"""
    return [
        {"language": "Hindi", "code": "hi", "voice": "Kajal", "type": "Neural", "native": True},
        {"language": "Tamil", "code": "ta", "voice": "Kajal (Hindi)", "type": "Neural", "native": False},
        {"language": "Bengali", "code": "bn", "voice": "Kajal (Hindi)", "type": "Neural", "native": False},
        {"language": "Marathi", "code": "mr", "voice": "Kajal (Hindi)", "type": "Neural", "native": False},
        {"language": "Telugu", "code": "te", "voice": "Kajal (Hindi)", "type": "Neural", "native": False},
    ]
