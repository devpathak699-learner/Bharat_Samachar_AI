"""
Lambda Handler: Health Check
Simple health/ping endpoint for the API Gateway + Lambda deployment.
"""
import json
import os


def handler(event, context=None):
    """AWS Lambda health check handler."""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({
            "status": "healthy",
            "service": "Bharat Samachar API",
            "version": "1.0.0",
            "aws_region": os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
            "bedrock_model": os.environ.get(
                "BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0"
            ),
        }),
    }
