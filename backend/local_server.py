"""
FastAPI Local Development Server
Wraps Lambda handlers for local testing.
Run: uvicorn local_server:app --reload --port 8000
"""
import os
import sys
import json
from pathlib import Path

# Fix Unicode output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import Optional, List

app = FastAPI(
    title="Bharat Samachar API",
    description="AI-Powered Multilingual News Localization - AWS Bedrock + Polly + DynamoDB",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", os.environ.get("FRONTEND_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProcessRequest(BaseModel):
    url: Optional[str] = None
    text: Optional[str] = None
    languages: List[str] = ["hi"]
    generate_audio: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://timesofindia.indiatimes.com/india/some-article",
                "languages": ["hi", "ta"],
                "generate_audio": True,
            }
        }


class GetArticleRequest(BaseModel):
    article_id: str


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Bharat Samachar API",
        "version": "1.0.0",
        "aws_region": os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
        "bedrock_model": os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0"),
    }


@app.get("/api/languages")
async def get_supported_languages():
    return {
        "languages": [
            {"code": "hi", "name": "Hindi", "native_name": "हिन्दी", "speakers": "528M", "audio_native": True},
            {"code": "ta", "name": "Tamil", "native_name": "தமிழ்", "speakers": "75M", "audio_native": False},
            {"code": "bn", "name": "Bengali", "native_name": "বাংলা", "speakers": "265M", "audio_native": False},
            {"code": "mr", "name": "Marathi", "native_name": "मराठी", "speakers": "83M", "audio_native": False},
            {"code": "te", "name": "Telugu", "native_name": "తెలుగు", "speakers": "81M", "audio_native": False},
        ]
    }


@app.post("/api/process")
async def process_article(request: ProcessRequest):
    """
    Main endpoint: Extract article → Translate → Generate Audio → Fact-check
    Powered by AWS Bedrock (Claude 3 Sonnet) + Amazon Polly + DynamoDB
    """
    from lambda_handlers.process_article import handler as lambda_handler

    event = {
        "body": {
            "url": request.url,
            "text": request.text,
            "languages": request.languages,
            "generate_audio": request.generate_audio,
        }
    }

    result = lambda_handler(event, context=None)
    status_code = result.get("statusCode", 200)
    body = json.loads(result.get("body", "{}"))

    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=body.get("error", "Unknown error"))

    return JSONResponse(content=body, status_code=status_code)


@app.get("/api/article/{article_id}")
async def get_article(article_id: str):
    """Retrieve a previously processed article from DynamoDB"""
    from services.dynamo_service import get_article

    article = get_article(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@app.post("/api/setup")
async def setup_aws():
    """
    Initialize AWS resources (create DynamoDB table, etc.)
    Run this once after setting up credentials.
    """
    from services.dynamo_service import ensure_table_exists
    success = ensure_table_exists()
    return {"success": success, "message": "AWS resources initialized" if success else "Setup failed"}


if __name__ == "__main__":
    import uvicorn
    from pathlib import Path
    
    # Get the absolute path to the backend directory
    backend_dir = Path(__file__).parent.absolute()
    
    print(f"[START] Starting Bharat Samachar API from: {backend_dir}")
    print("[INFO] Tip: Backend is watching for changes in the 'backend/' directory only.")
    
    uvicorn.run(
        "local_server:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        reload_dirs=[str(backend_dir)]
    )
