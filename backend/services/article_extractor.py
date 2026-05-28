"""
Article Extractor Service
Uses newspaper3k + BeautifulSoup to extract clean article content from URLs
"""
import requests
from bs4 import BeautifulSoup
import re

try:
    from newspaper import Article
    NEWSPAPER_AVAILABLE = True
except ImportError:
    NEWSPAPER_AVAILABLE = False


def extract_article(url: str = None, text: str = None) -> dict:
    """
    Extract article content from a URL or raw text.
    Returns: {title, content, author, publish_date, source_url, word_count}
    """
    if text:
        return _process_raw_text(text, url)
    
    if not url:
        raise ValueError("Either url or text must be provided")
    
    # Try newspaper3k first
    if NEWSPAPER_AVAILABLE:
        try:
            return _extract_with_newspaper(url)
        except Exception:
            pass
    
    # Fallback to BeautifulSoup
    return _extract_with_bs4(url)


def _extract_with_newspaper(url: str) -> dict:
    """Use newspaper3k for article extraction"""
    article = Article(url)
    article.download()
    article.parse()
    
    if not article.text or len(article.text) < 100:
        raise ValueError("Insufficient article content extracted")
    
    return {
        "title": article.title or "Untitled Article",
        "content": article.text,
        "author": ", ".join(article.authors) if article.authors else "Unknown",
        "publish_date": str(article.publish_date) if article.publish_date else None,
        "source_url": url,
        "word_count": len(article.text.split()),
        "top_image": article.top_image or None,
    }


def _extract_with_bs4(url: str) -> dict:
    """Fallback: BeautifulSoup extraction"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, "html.parser")
    
    # Remove script, style, nav, footer tags
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "advertisement"]):
        tag.decompose()
    
    # Extract title
    title = ""
    if soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)
    elif soup.find("title"):
        title = soup.find("title").get_text(strip=True)
    
    # Extract article body
    article_body = soup.find("article") or soup.find(class_=re.compile(r"article|content|story|body", re.I))
    
    if article_body:
        paragraphs = article_body.find_all("p")
    else:
        paragraphs = soup.find_all("p")
    
    content = "\n\n".join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 50)
    
    if not content:
        content = soup.get_text(separator="\n", strip=True)[:5000]
    
    return {
        "title": title or "Untitled Article",
        "content": content[:8000],  # Limit to 8000 chars for API efficiency
        "author": "Unknown",
        "publish_date": None,
        "source_url": url,
        "word_count": len(content.split()),
        "top_image": None,
    }


def _process_raw_text(text: str, url: str = None) -> dict:
    """Process raw pasted text"""
    # Try to extract title from first line
    lines = text.strip().split('\n')
    title = lines[0].strip() if lines else "Pasted Article"
    content = "\n".join(lines[1:]).strip() if len(lines) > 1 else text
    
    return {
        "title": title,
        "content": content or text,
        "author": "Unknown",
        "publish_date": None,
        "source_url": url or "direct-input",
        "word_count": len(text.split()),
        "top_image": None,
    }
