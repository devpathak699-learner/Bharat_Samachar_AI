"""
Main Lambda Handler: Process Article
Orchestrates article extraction → translation → audio → fact-check
Deployable as AWS Lambda or run locally
"""
import json
import os
import sys
from pathlib import Path

# Allow imports from parent directory when running as Lambda
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.article_extractor import extract_article
from services.bedrock_service import (
    culturally_translate,
    generate_audio_script,
    generate_social_posts,
    fact_check_article,
)
from services.polly_service import generate_audio
from services.dynamo_service import save_article, ensure_table_exists
from services.cultural_db import get_cultural_mappings

SUPPORTED_LANGUAGES = {
    "hi": {"name": "Hindi", "native_name": "हिन्दी", "flag": "🇮🇳"},
    "ta": {"name": "Tamil", "native_name": "தமிழ்", "flag": "🇮🇳"},
    "bn": {"name": "Bengali", "native_name": "বাংলা", "flag": "🇮🇳"},
    "mr": {"name": "Marathi", "native_name": "मराठी", "flag": "🇮🇳"},
    "te": {"name": "Telugu", "native_name": "తెలుగు", "flag": "🇮🇳"},
}


def handler(event, context=None):
    """
    AWS Lambda handler / FastAPI compatible handler.
    
    Expected input:
    {
      "url": "https://...",          # OR
      "text": "Raw article text",
      "languages": ["hi", "ta"],
      "generate_audio": true
    }
    """
    try:
        # Parse body
        if isinstance(event.get("body"), str):
            body = json.loads(event["body"])
        else:
            body = event.get("body", event)

        url = (body.get("url") or "").strip()
        text = (body.get("text") or "").strip()
        languages = body.get("languages", ["hi"])
        generate_audio_flag = body.get("generate_audio", True)

        if not url and not text:
            return _error_response(400, "Either 'url' or 'text' is required")

        # Validate languages
        invalid_langs = [l for l in languages if l not in SUPPORTED_LANGUAGES]
        if invalid_langs:
            return _error_response(400, f"Unsupported languages: {invalid_langs}")

        # Step 1: Extract article
        print(f"📰 Extracting article from: {url or 'direct text'}")
        article_data = extract_article(url=url or None, text=text or None)
        
        if len(article_data["content"]) < 50:
            return _error_response(400, "Article content too short. Please provide a valid article URL.")

        # Step 2: Fact-check the original article
        print("🔍 Running fact-check...")
        fact_check = fact_check_article(
            article_data["title"],
            article_data["content"]
        )

        # Step 3: Process each language
        translations = []
        for lang_code in languages:
            lang_info = SUPPORTED_LANGUAGES[lang_code]
            lang_name = lang_info["name"]
            print(f"🌐 Translating to {lang_name}...")

            cultural_mappings = get_cultural_mappings(lang_code)

            # Cultural translation via Bedrock
            translation = culturally_translate(
                article_data["title"],
                article_data["content"],
                lang_code,
                lang_name,
                cultural_mappings,
            )

            # Audio script generation
            script = generate_audio_script(
                article_data["title"],
                article_data["content"],
                lang_name,
            )

            # Social posts
            social = generate_social_posts(
                article_data["title"],
                article_data["content"],
                lang_name,
            )

            translations.append({
                "language_code": lang_code,
                "language_name": lang_name,
                "native_name": lang_info["native_name"],
                "flag": lang_info["flag"],
                "translated_title": translation.get("translated_title", ""),
                "translated_content": translation.get("translated_content", ""),
                "summary": translation.get("summary_in_language", ""),
                "cultural_adaptations": translation.get("cultural_adaptations", []),
                "audio_script": script,
                "social_posts": social,
                "audio": None,  # Populated below
            })

        # Step 4: Generate audio (Hindi only for prototype)
        audio_results = []
        if generate_audio_flag:
            for trans in translations:
                lang_code = trans["language_code"]
                script_text = trans["audio_script"].get("script_text", trans["summary"])
                
                print(f"🎙️ Generating audio for {trans['language_name']}...")
                try:
                    audio_result = generate_audio(
                        script_text=script_text,
                        language_code=lang_code,
                        article_id="temp",
                    )
                    trans["audio"] = audio_result
                    audio_results.append({**audio_result, "language_code": lang_code})
                except Exception as e:
                    print(f"⚠️ Audio generation failed for {lang_code}: {e}")
                    trans["audio"] = {"error": str(e)}

        # Step 5: Save to DynamoDB
        ensure_table_exists()
        article_id = save_article(article_data, translations, fact_check, audio_results)
        print(f"✅ Saved article {article_id} to DynamoDB")

        # Build response
        response_data = {
            "article_id": article_id,
            "source": {
                "title": article_data["title"],
                "url": article_data["source_url"],
                "author": article_data["author"],
                "word_count": article_data["word_count"],
                "content": article_data["content"][:8000],  # Original article text
            },
            "fact_check": fact_check,
            "translations": translations,
            "languages_processed": len(translations),
        }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            },
            "body": json.dumps(response_data, ensure_ascii=False),
        }

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return _error_response(500, f"Processing failed: {str(e)}")


def _error_response(status_code: int, message: str) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"error": message}),
    }
