"""
Lambda Handler: Get Article
Retrieves a previously processed article from DynamoDB by article_id.
Deployable as AWS Lambda or used via the FastAPI local server.
"""
import json
import sys
from pathlib import Path

# Allow imports from parent directory when running as Lambda
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.dynamo_service import get_article


def handler(event, context=None):
    """
    AWS Lambda handler to retrieve a processed article by ID.

    Path parameter: article_id (from API Gateway path)
    Example: GET /api/article/{article_id}
    """
    try:
        # Extract article_id from API Gateway path parameters
        path_params = event.get("pathParameters") or {}
        article_id = path_params.get("article_id", "").strip()

        if not article_id:
            return _error_response(400, "article_id path parameter is required")

        print(f"📖 Fetching article: {article_id}")
        article = get_article(article_id)

        if not article:
            return _error_response(404, f"Article '{article_id}' not found")

        # Remove internal TTL field before returning
        article.pop("ttl", None)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
            },
            "body": json.dumps(article, ensure_ascii=False, default=str),
        }

    except Exception as e:
        print(f"❌ Error fetching article: {e}")
        import traceback
        traceback.print_exc()
        return _error_response(500, f"Failed to retrieve article: {str(e)}")


def _error_response(status_code: int, message: str) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({"error": message}),
    }
