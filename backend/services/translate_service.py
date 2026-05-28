"""
Amazon Translate Service
Used as a fast base translation layer before Bedrock cultural adaptation
"""
import os
import boto3


def _get_client():
    return boto3.client(
        "translate",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


LANGUAGE_CODE_MAP = {
    "hi": "hi",   # Hindi
    "ta": "ta",   # Tamil
    "bn": "bn",   # Bengali
    "mr": "mr",   # Marathi
    "te": "te",   # Telugu
    "gu": "gu",   # Gujarati
    "kn": "kn",   # Kannada
    "ml": "ml",   # Malayalam
    "pa": "pa",   # Punjabi
    "ur": "ur",   # Urdu
}


def translate_text(text: str, target_language: str, source_language: str = "en") -> str:
    """
    Translate text using Amazon Translate.
    This is used as a base layer; Bedrock then applies cultural adaptation.
    """
    client = _get_client()
    target_code = LANGUAGE_CODE_MAP.get(target_language, target_language)

    # Amazon Translate has 10,000 char limit per request
    chunks = _split_text(text, max_chars=9000)
    translated_chunks = []

    for chunk in chunks:
        response = client.translate_text(
            Text=chunk,
            SourceLanguageCode=source_language,
            TargetLanguageCode=target_code,
        )
        translated_chunks.append(response["TranslatedText"])

    return "\n\n".join(translated_chunks)


def detect_language(text: str) -> str:
    """Detect the language of input text"""
    client = _get_client()
    # Use a sample of the text
    sample = text[:500]
    response = client.translate_text(
        Text=sample,
        SourceLanguageCode="auto",
        TargetLanguageCode="en",
    )
    return response.get("AppliedSourceLanguageCode", "en")


def _split_text(text: str, max_chars: int = 9000) -> list:
    """Split long text into chunks for Amazon Translate"""
    if len(text) <= max_chars:
        return [text]
    
    chunks = []
    paragraphs = text.split("\n\n")
    current_chunk = ""
    
    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_chars:
            current_chunk += para + "\n\n"
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = para + "\n\n"
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks if chunks else [text[:max_chars]]
