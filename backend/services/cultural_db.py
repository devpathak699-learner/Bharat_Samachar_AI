"""
Cultural Mappings Database
Loads and queries cultural idiom/reference mappings from JSON
"""
import json
import os
from pathlib import Path


_MAPPINGS_CACHE = None

LANG_KEY_MAP = {
    "hi": "en_to_hi",
    "ta": "en_to_ta",
    "bn": "en_to_bn",
    "mr": "en_to_mr",
    "te": "en_to_te",
}


def _load_mappings() -> dict:
    global _MAPPINGS_CACHE
    if _MAPPINGS_CACHE is None:
        data_path = Path(__file__).parent.parent / "data" / "cultural_mappings.json"
        with open(data_path, "r", encoding="utf-8") as f:
            _MAPPINGS_CACHE = json.load(f)
    return _MAPPINGS_CACHE


def get_cultural_mappings(language_code: str) -> list:
    """
    Get cultural phrase mappings for the specified target language.
    Always includes the Hindi mappings as a base.
    """
    mappings = _load_mappings()
    lang_key = LANG_KEY_MAP.get(language_code, "en_to_hi")
    
    # Return language-specific + universal Hindi ones
    lang_specific = mappings.get(lang_key, [])
    base = mappings.get("en_to_hi", [])
    
    if lang_key == "en_to_hi":
        return base
    
    # Merge: language-specific overrides base
    combined = {m["source"]: m for m in base}
    for m in lang_specific:
        combined[m["source"]] = m
    
    return list(combined.values())


def find_mapping(phrase: str, language_code: str) -> str | None:
    """
    Look up a specific phrase in the cultural database.
    Returns adapted phrase or None if not found.
    """
    mappings = get_cultural_mappings(language_code)
    phrase_lower = phrase.lower().strip()
    
    for mapping in mappings:
        if mapping["source"].lower() == phrase_lower:
            return mapping["target"]
    
    return None


def get_all_source_phrases() -> list:
    """Returns all source phrases across all languages for detection"""
    mappings = _load_mappings()
    sources = set()
    for key, entries in mappings.items():
        for entry in entries:
            sources.add(entry["source"].lower())
    return list(sources)
