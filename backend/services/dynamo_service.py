"""
Amazon DynamoDB Service
Stores articles, translations, and processing results
"""
import os
import uuid
import json
from datetime import datetime, timezone
import boto3
from boto3.dynamodb.conditions import Key


def _get_table():
    dynamodb = boto3.resource(
        "dynamodb",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )
    return dynamodb.Table(os.environ.get("DYNAMO_TABLE_NAME", "bharat-samachar-articles"))


def save_article(
    article_data: dict,
    translations: list,
    fact_check: dict,
    audio_results: list,
) -> str:
    """
    Save a fully processed article to DynamoDB.
    Returns the article_id.
    """
    table = _get_table()
    article_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()

    item = {
        "article_id": article_id,
        "created_at": timestamp,
        "source_url": article_data.get("source_url", ""),
        "title": article_data.get("title", ""),
        "original_content": article_data.get("content", "")[:5000],  # Limit size
        "word_count": article_data.get("word_count", 0),
        "author": article_data.get("author", "Unknown"),
        "publish_date": article_data.get("publish_date") or "",
        "translations": translations,
        "fact_check": fact_check,
        "audio_results": audio_results,
        "status": "completed",
        "ttl": int((datetime.now(timezone.utc).timestamp()) + (30 * 24 * 3600)),  # 30 days
    }

    table.put_item(Item=item)
    return article_id


def get_article(article_id: str) -> dict:
    """Retrieve a processed article by ID"""
    table = _get_table()
    response = table.get_item(Key={"article_id": article_id})
    return response.get("Item")


def save_processing_status(article_id: str, status: str, progress: int = 0) -> None:
    """Update processing status for an article"""
    table = _get_table()
    table.update_item(
        Key={"article_id": article_id},
        UpdateExpression="SET #s = :s, progress = :p, updated_at = :t",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":s": status,
            ":p": progress,
            ":t": datetime.now(timezone.utc).isoformat(),
        },
    )


def ensure_table_exists() -> bool:
    """
    Create DynamoDB table if it doesn't exist.
    Run this once during setup.
    """
    dynamodb = boto3.resource(
        "dynamodb",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )
    
    table_name = os.environ.get("DYNAMO_TABLE_NAME", "bharat-samachar-articles")
    
    try:
        table = dynamodb.Table(table_name)
        table.load()
        print(f"✅ DynamoDB table '{table_name}' already exists")
        return True
    except Exception:
        pass
    
    try:
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {"AttributeName": "article_id", "KeyType": "HASH"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "article_id", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        table.wait_until_exists()

        # TTL must be set separately after table creation
        client = boto3.client(
            "dynamodb",
            region_name=os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )
        client.update_time_to_live(
            TableName=table_name,
            TimeToLiveSpecification={"Enabled": True, "AttributeName": "ttl"},
        )
        print(f"✅ Created DynamoDB table '{table_name}'")
        return True
    except Exception as e:
        print(f"❌ Failed to create DynamoDB table: {e}")
        return False
