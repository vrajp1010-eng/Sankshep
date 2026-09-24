import os
import re
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

logger = logging.getLogger("sankshep.providers")

# Redaction helper for server logs
def redact_secrets(text: str) -> str:
    """Redacts potential API keys and Authorization headers from log messages."""
    if not isinstance(text, str):
        return str(text)
    text = re.sub(r'sk-[a-zA-Z0-9_\-]{8,}', 'sk-[REDACTED]', text)
    text = re.sub(r'AIzaSy[a-zA-Z0-9_\-]{10,}', 'AIzaSy[REDACTED]', text)
    text = re.sub(r'AQ\.[a-zA-Z0-9_\-]{10,}', 'AQ.[REDACTED]', text)
    text = re.sub(r'gsk_[a-zA-Z0-9_\-]{8,}', 'gsk_[REDACTED]', text)
    text = re.sub(r'Bearer\s+[a-zA-Z0-9_\-\.]{8,}', 'Bearer [REDACTED]', text, flags=re.IGNORECASE)
    text = re.sub(r'(api[_-]?key[\'\"]?\s*[:=]\s*[\'\"]?)[a-zA-Z0-9_\-]{8,}([\'\"]?)', r'\1[REDACTED]\2', text, flags=re.IGNORECASE)
    return text

# Resilient fallback model pool for Google Gemini.
# If the primary model is busy or unavailable, the next model is tried automatically.
GEMINI_MODELS_POOL = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-pro",
    "gemini-2.0-pro",
]

def _create_gemini_llm(key: str, model: str, streaming: bool):
    """
    Creates a Google Gemini LLM with automatic model fallback.
    If the primary model is busy or fails, the next model in the pool is tried.
    """
    from langchain_google_genai import ChatGoogleGenerativeAI

    # Put requested model first, followed by all remaining pool models
    models_to_try = [model or GEMINI_MODELS_POOL[0]]
    for m in GEMINI_MODELS_POOL:
        if m not in models_to_try:
            models_to_try.append(m)

    primary = ChatGoogleGenerativeAI(
        model=models_to_try[0],
        google_api_key=key,
        temperature=0.7,
        streaming=streaming,
    )

    fallbacks = [
        ChatGoogleGenerativeAI(
            model=m,
            google_api_key=key,
            temperature=0.7,
            streaming=streaming,
        )
        for m in models_to_try[1:]
    ]

    if fallbacks:
        return primary.with_fallbacks(fallbacks)
    return primary


def _create_groq_llm(key: str, model: str, streaming: bool):
    """
    Creates a Groq LLM instance using LangChain's ChatGroq wrapper.
    Uses openai/gpt-oss-120b by default.
    """
    from langchain_groq import ChatGroq

    return ChatGroq(
        model=model or "openai/gpt-oss-120b",
        groq_api_key=key,
        temperature=0.7,
        streaming=streaming,
    )


# Central Provider Registry — Gemini + Groq
PROVIDER_REGISTRY: Dict[str, Dict[str, Any]] = {
    "gemini": {
        "id": "gemini",
        "label": "Google Gemini",
        "model_default": "gemini-2.5-flash",
        "model_env": "GEMINI_MODEL",
        "model_pool": GEMINI_MODELS_POOL,
        "base_url": "https://generativelanguage.googleapis.com",
        "key_env": "GEMINI_API_KEY",
        "key_aliases": ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
        "factory": _create_gemini_llm,
    },
    "groq": {
        "id": "groq",
        "label": "Groq",
        "model_default": "openai/gpt-oss-120b",
        "model_env": "GROQ_MODEL",
        "model_pool": [],
        "base_url": "https://api.groq.com",
        "key_env": "GROQ_API_KEY",
        "key_aliases": ["GROQ_API_KEY"],
        "factory": _create_groq_llm,
    },
}

def get_provider_key(provider_id: str) -> str:
    """Retrieves the configured API key for a provider from env or aliases."""
    load_dotenv(override=True)
    entry = PROVIDER_REGISTRY.get(provider_id)
    if not entry:
        return ""
    for k in entry.get("key_aliases", [entry["key_env"]]):
        val = os.getenv(k, "").strip()
        if val:
            return val
    return ""

def get_provider_model(provider_id: str) -> str:
    """Returns the effective model name for a provider from env or default."""
    entry = PROVIDER_REGISTRY.get(provider_id)
    if not entry:
        return ""
    return os.getenv(entry.get("model_env", ""), entry.get("model_default", ""))

def is_provider_available(provider_id: str) -> bool:
    """Checks if the provider's API key is configured in the environment."""
    return bool(get_provider_key(provider_id))

def get_default_provider_id() -> str:
    """Return the default AI provider based on DEFAULT_PROVIDER env var.

    Falls back through available providers if the preferred one is not configured.
    Raises HTTPException(503) if no provider is available.
    """
    preferred = os.getenv("DEFAULT_PROVIDER", "gemini").strip().lower()

    # Try the preferred provider first
    if preferred in PROVIDER_REGISTRY and is_provider_available(preferred):
        return preferred

    # Fall back to any available provider
    for pid in PROVIDER_REGISTRY:
        if is_provider_available(pid):
            return pid

    raise HTTPException(
        status_code=503,
        detail="No AI provider is configured. Please set GEMINI_API_KEY or GROQ_API_KEY in your .env file.",
    )

def list_public_providers() -> List[Dict[str, Any]]:
    """
    Returns public metadata about providers without exposing keys or env var names.
    Safe for consumption by GET /providers.
    """
    providers = []
    for pid, entry in PROVIDER_REGISTRY.items():
        providers.append({
            "id": entry["id"],
            "label": entry["label"],
            "model": get_provider_model(pid),
            "available": is_provider_available(pid),
            "fallback_models": entry.get("model_pool", []),
        })
    return providers

def validate_provider_id(provider_id: Optional[str]) -> str:
    """
    Validates provider_id against the allowlist.
    Returns the resolved provider ID.
    Raises HTTPException(400) for unknown providers.
    Raises HTTPException(503) if the key is not configured.
    """
    if not provider_id or not str(provider_id).strip():
        resolved_id = get_default_provider_id()
    else:
        resolved_id = str(provider_id).strip().lower()

    if resolved_id not in PROVIDER_REGISTRY:
        allowed = list(PROVIDER_REGISTRY.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider '{provider_id}'. Allowed providers: {allowed}",
        )

    if not is_provider_available(resolved_id):
        label = PROVIDER_REGISTRY[resolved_id]["label"]
        key_env = PROVIDER_REGISTRY[resolved_id]["key_env"]
        raise HTTPException(
            status_code=503,
            detail=f"Provider '{label}' is not configured on the server. Please set {key_env} in your .env file.",
        )

    return resolved_id

def get_llm_for_provider(provider_id: Optional[str] = None, streaming: bool = True):
    """
    Initializes and returns the LLM instance for a validated provider.
    Reads credentials from server-side environment variables only.
    """
    resolved_id = validate_provider_id(provider_id)
    entry = PROVIDER_REGISTRY[resolved_id]
    key = get_provider_key(resolved_id)
    model = get_provider_model(resolved_id)
    return entry["factory"](key=key, model=model, streaming=streaming)

def check_provider_startup_status():
    """
    Startup diagnostics: warns about missing provider keys by name only (never values).
    """
    configured = []
    missing = []
    for pid, entry in PROVIDER_REGISTRY.items():
        key_name = entry["key_env"]
        if is_provider_available(pid):
            configured.append(f"{entry['label']} ({key_name})")
        else:
            missing.append(f"{entry['label']} ({key_name})")

    logger.info("Sankshep Provider Registry initialized.")
    if configured:
        logger.info(f"Available AI providers: {', '.join(configured)}")
    if missing:
        logger.warning(f"Unconfigured AI providers: {', '.join(missing)} (set in .env to enable)")
