"""
Amazon Bedrock Service (Claude 3 Sonnet)
Handles: Cultural Translation, Script Generation, Social Posts
"""
import json
import os
import boto3
from botocore.exceptions import ClientError


def _get_client():
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def _invoke_claude(prompt: str, system_prompt: str = None, max_tokens: int = 4096) -> str:
    """
    Invoke Claude 3 Sonnet on Bedrock and return text response.
    """
    client = _get_client()
    model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")

    messages = [{"role": "user", "content": prompt}]
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system_prompt:
        body["system"] = system_prompt

    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(body),
    )
    response_body = json.loads(response["body"].read())
    return response_body["content"][0]["text"]


def culturally_translate(
    article_title: str,
    article_content: str,
    target_language: str,
    language_name: str,
    cultural_mappings: list,
) -> dict:
    """
    Translate and culturally adapt an article using Claude 3 Sonnet.
    Returns structured dict with translation + adaptations made.
    """
    # Build cultural context from mappings
    mapping_examples = "\n".join(
        f'  - "{m["source"]}" → "{m["target"]}"' for m in cultural_mappings[:30]
    )

    system_prompt = f"""You are an expert cultural translator for Indian languages. 
Your job is NOT just to translate words, but to ADAPT content so it feels natural and relatable to {language_name} speakers in India.

Cultural Adaptation Rules:
1. Replace Western cultural references with Indian equivalents
2. Replace Western idioms with culturally equivalent Indian expressions
3. Maintain the original meaning and emotional tone
4. Keep proper nouns (brand names, person names, place names) as-is unless an Indian equivalent exists
5. Numbers, statistics, and data should be kept accurate

Known cultural mappings to apply:
{mapping_examples}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanation text."""

    prompt = f"""Translate and culturally adapt the following news article to {language_name} ({target_language}).

ARTICLE TITLE: {article_title}

ARTICLE CONTENT:
{article_content[:4000]}

Return a JSON object with EXACTLY this structure:
{{
  "translated_title": "Article title in {language_name}",
  "translated_content": "Full translated and culturally adapted article in {language_name}",
  "cultural_adaptations": [
    {{"original": "English phrase", "adapted": "{language_name} equivalent", "explanation": "why this was changed"}}
  ],
  "summary_in_language": "2-3 sentence summary of the article in {language_name}",
  "reading_time_minutes": 3
}}"""

    response_text = _invoke_claude(prompt, system_prompt, max_tokens=3000)
    
    # Parse JSON response
    try:
        # Handle if Claude wraps in code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Fallback structure if JSON parsing fails
        return {
            "translated_title": article_title,
            "translated_content": response_text,
            "cultural_adaptations": [],
            "summary_in_language": "",
            "reading_time_minutes": 3,
        }


def generate_audio_script(article_title: str, article_content: str, language_name: str) -> dict:
    """
    Generate a 30-second audio/video script from the article.
    """
    system_prompt = """You are a professional broadcast journalist scriptwriter for Indian news channels.
Write punchy, engaging scripts that sound natural when spoken aloud.
Return ONLY valid JSON, no markdown."""

    prompt = f"""Write a 30-second audio news script in {language_name} for the following article.
The script should sound like a professional TV news anchor.

ARTICLE TITLE: {article_title}
ARTICLE CONTENT: {article_content[:2000]}

Return JSON with this structure:
{{
  "script_text": "The full 30-second script in {language_name} (approximately 75-80 words)",
  "script_hindi_transliteration": "Roman transliteration if needed",
  "key_points": ["point 1", "point 2", "point 3"],
  "tone": "serious/informative/urgent/positive",
  "estimated_duration_seconds": 30
}}"""

    response_text = _invoke_claude(prompt, system_prompt, max_tokens=1000)
    
    try:
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        return json.loads(response_text)
    except:
        return {
            "script_text": response_text[:500],
            "key_points": [],
            "tone": "informative",
            "estimated_duration_seconds": 30,
        }


def generate_social_posts(article_title: str, article_content: str, language_name: str) -> dict:
    """
    Generate Twitter, Instagram, and WhatsApp posts in the target language.
    """
    system_prompt = """You are a social media manager for an Indian news platform.
Create engaging viral social media content in the specified language.
Return ONLY valid JSON."""

    prompt = f"""Create social media posts in {language_name} for this news article.

ARTICLE TITLE: {article_title}
SUMMARY: {article_content[:1000]}

Return JSON:
{{
  "twitter": "Tweet in {language_name} (max 280 chars, include 2-3 hashtags)",
  "instagram": "Instagram caption in {language_name} (engaging, with emojis, 5-7 hashtags)",
  "whatsapp": "WhatsApp forward-worthy message in {language_name} (2-3 sentences, suitable for sharing)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#BharatSamachar"],
  "emoji_headline": "Article title with relevant emojis"
}}"""

    response_text = _invoke_claude(prompt, system_prompt, max_tokens=800)
    
    try:
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        return json.loads(response_text)
    except:
        return {
            "twitter": article_title,
            "instagram": article_title,
            "whatsapp": article_title,
            "hashtags": ["#BharatSamachar", "#News"],
            "emoji_headline": article_title,
        }


def fact_check_article(article_title: str, article_content: str) -> dict:
    """
    Use Claude to assess the credibility and identify claims in an article.
    """
    system_prompt = """You are a fact-checking expert for Indian news media.
Analyze articles for credibility, identify key claims, and flag potential misinformation.
Return ONLY valid JSON."""

    prompt = f"""Analyze this news article for factual credibility.

ARTICLE TITLE: {article_title}
ARTICLE CONTENT: {article_content[:3000]}

Return JSON:
{{
  "credibility_score": 85,
  "credibility_label": "High/Medium/Low/Unverified",
  "credibility_color": "green/yellow/orange/red",
  "key_claims": [
    {{"claim": "specific factual claim from article", "status": "Likely True/Needs Verification/Potentially False", "explanation": "brief reason"}}
  ],
  "red_flags": ["any concerning elements, or empty array"],
  "recommended_sources": ["PIB", "Reuters", "WHO"],
  "overall_assessment": "2-3 sentence overall assessment of the article's reliability"
}}"""

    response_text = _invoke_claude(prompt, system_prompt, max_tokens=1200)
    
    try:
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        return json.loads(response_text)
    except:
        return {
            "credibility_score": 70,
            "credibility_label": "Medium",
            "credibility_color": "yellow",
            "key_claims": [],
            "red_flags": [],
            "recommended_sources": ["PIB", "Reuters"],
            "overall_assessment": "Unable to fully assess. Please verify with trusted sources.",
        }
