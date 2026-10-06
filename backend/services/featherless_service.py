"""
Featherless.ai integration — Aegis's second-opinion AI provider.

Featherless offers an OpenAI-compatible chat-completions API hosting a wide
catalog of open-source models. Aegis uses it as a dual-shield verifier:
Gemini is the primary, Featherless cross-checks.

Docs: https://featherless.ai/docs
"""
import os
import json
import re
from typing import Optional
import httpx

FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "")
FEATHERLESS_MODEL = os.getenv("FEATHERLESS_MODEL", "meta-llama/Meta-Llama-3.1-8B-Instruct")
FEATHERLESS_URL = "https://api.featherless.ai/v1/chat/completions"


def is_enabled() -> bool:
    return bool(FEATHERLESS_API_KEY)


def _extract_json(text: str) -> dict:
    if not text:
        return {}
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return {}


def second_opinion(message: str) -> dict:
    """
    Returns a scam verdict from Featherless (open-source LLM).
    {verdict, threat_score, scam_type, reasoning} or {} when disabled/failed.
    """
    if not is_enabled():
        return {}
    prompt = (
        "You are a cybersecurity scam detector. Analyze this message and return ONLY valid JSON:\n"
        '{"verdict": "SAFE|SUSPICIOUS|LIKELY_SCAM|DANGEROUS", "threat_score": 0-100, '
        '"scam_type": "<category or None>", "reasoning": "<one sentence why>"}\n\n'
        f"Message:\n{message}"
    )
    try:
        r = httpx.post(
            FEATHERLESS_URL,
            headers={
                "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": FEATHERLESS_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 400,
                "response_format": {"type": "json_object"},
            },
            timeout=20.0,
        )
        if r.status_code != 200:
            return {"error": f"featherless {r.status_code}"}
        text = r.json()["choices"][0]["message"]["content"]
        data = _extract_json(text)
        if data:
            data["provider"] = f"Featherless · {FEATHERLESS_MODEL}"
        return data
    except Exception as e:
        return {"error": str(e)}


def chat_reply(messages: list, system_prompt: str) -> dict:
    """
    Multi-turn chat via Featherless, used as fallback or alternative to Gemini.
    """
    if not is_enabled():
        return {}
    convo = [{"role": "system", "content": system_prompt}]
    for m in messages:
        convo.append({"role": "user" if m.get("role") == "user" else "assistant",
                      "content": m.get("content", "")})
    try:
        r = httpx.post(
            FEATHERLESS_URL,
            headers={
                "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": FEATHERLESS_MODEL,
                "messages": convo,
                "temperature": 0.5,
                "max_tokens": 600,
            },
            timeout=25.0,
        )
        if r.status_code != 200:
            return {"error": f"featherless {r.status_code}"}
        text = r.json()["choices"][0]["message"]["content"]
        return {"reply": (text or "").strip(), "provider": f"Featherless · {FEATHERLESS_MODEL}"}
    except Exception as e:
        return {"error": str(e)}
