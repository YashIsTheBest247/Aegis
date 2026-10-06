import os
import json
import re
import base64
import time
from collections import deque
from typing import Optional

from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

_client: Optional[genai.Client] = None

# in-memory ring buffer of recent anonymized scans (for the live threat feed)
RECENT_SCANS: deque = deque(maxlen=40)


def _get_client() -> Optional[genai.Client]:
    global _client
    if not GEMINI_API_KEY:
        return None
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


_gen_config = types.GenerateContentConfig(
    temperature=0.3,
    top_p=0.95,
    top_k=40,
    max_output_tokens=2048,
    response_mime_type="application/json",
)

# For multimodal (image/audio) we skip response_mime_type since vision prompts return mixed content
_gen_config_vision = types.GenerateContentConfig(
    temperature=0.3,
    top_p=0.95,
    top_k=40,
    max_output_tokens=2048,
)


def _extract_json(text: str) -> dict:
    if not text:
        return {}
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return {}


def _log_scan(kind: str, verdict: str, score: int, snippet: str = ""):
    # Anonymize: keep first 50 chars only, strip URLs/emails
    clean = re.sub(r"https?://\S+", "[link]", snippet or "")
    clean = re.sub(r"\S+@\S+", "[email]", clean)[:80]
    RECENT_SCANS.appendleft({
        "kind": kind,
        "verdict": verdict,
        "score": score,
        "snippet": clean,
        "ts": int(time.time()),
    })


SCAM_ANALYSIS_PROMPT = """You are Aegis AI, an expert cybersecurity and scam-detection system that protects everyday people from fraud.

Analyze the following suspicious message for scam indicators. Consider:
- Phishing attempts (fake links, credential harvesting)
- Social engineering (urgency, authority, fear, scarcity)
- Impersonation (fake companies, government, family emergencies)
- Financial fraud (fake invoices, crypto scams, wire fraud)
- Romance / investment scams
- AI-generated content patterns (overly polished grammar, generic phrases, unusual syntax)
- Suspicious links, phone numbers, or payment demands
- Grammar / spelling errors typical of scams

Message to analyze:
---
{message}
---

Return ONLY valid JSON matching this exact schema:
{{
  "threat_score": <integer 0-100>,
  "verdict": "<SAFE | SUSPICIOUS | LIKELY_SCAM | DANGEROUS>",
  "scam_type": "<primary category, e.g. 'Phishing', 'Impersonation', 'Investment Scam', 'Romance Scam', 'None'>",
  "ai_generated_likelihood": <integer 0-100>,
  "red_flags": [
    {{"flag": "<short name>", "detail": "<one sentence explanation>", "severity": "<low|medium|high|critical>"}}
  ],
  "recommended_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "explanation": "<2-3 sentence plain English explanation a non-technical user can understand>",
  "confidence": <integer 0-100>
}}

Be strict. If anything looks remotely suspicious, flag it. Score aggressively to protect users."""


URL_ANALYSIS_PROMPT = """You are Aegis AI's URL safety analyzer. Analyze the following URL for phishing, scam, and fraud indicators.

Look for:
- Typosquatting (fake versions of real domains like paypa1.com, g00gle.com, amaz0n-security.com)
- Suspicious TLDs (.xyz, .top, .click, .zip)
- URL shorteners masking real destinations
- IP addresses instead of domains
- Excessive subdomains or long suspicious paths
- Impersonation of banks, payment, government, delivery services
- Suspicious query parameters or redirect patterns
- Known scam patterns (crypto, lottery, prize, verification urgency)

URL: {url}

Return ONLY valid JSON:
{{
  "threat_score": <0-100>,
  "verdict": "<SAFE | SUSPICIOUS | LIKELY_PHISHING | DANGEROUS>",
  "category": "<phishing | malware | typosquatting | legitimate | shortener | unknown>",
  "impersonating": "<brand being impersonated, or 'none'>",
  "red_flags": [{{"flag": "<name>", "detail": "<explanation>", "severity": "<low|medium|high|critical>"}}],
  "recommendation": "<one sentence action to take>",
  "safe_alternative": "<if impersonating a brand, suggest the real URL, else 'none'>",
  "confidence": <0-100>
}}"""


CALL_ANALYSIS_PROMPT = """You are Aegis AI's voice-call scam analyzer. Analyze this transcript of a phone or voice interaction for scam indicators.

Watch for:
- Impersonation (IRS, Social Security, bank, Microsoft support, police, grandchild in trouble)
- Pressure tactics (immediate payment, threats of arrest, limited-time offers)
- Requests for gift cards, wire transfers, crypto, remote computer access
- Voice cloning / deepfake indicators (robotic phrasing, generic emotional appeals, inconsistencies)
- Caller refuses callback or verification
- Unusual payment methods

Transcript:
---
{transcript}
---

Return ONLY valid JSON:
{{
  "threat_score": <0-100>,
  "verdict": "<SAFE | SUSPICIOUS | LIKELY_SCAM | DANGEROUS>",
  "scam_type": "<e.g. 'Tech Support Scam', 'IRS Impersonation', 'Grandparent Scam', 'None'>",
  "deepfake_voice_likelihood": <0-100>,
  "red_flags": [{{"flag": "<name>", "detail": "<explanation>", "severity": "<low|medium|high|critical>"}}],
  "tactics_used": ["<social engineering tactic>", ...],
  "recommended_actions": ["<action 1>", "<action 2>"],
  "explanation": "<plain English 2-3 sentence summary>",
  "confidence": <0-100>
}}"""


DEEPFAKE_TEXT_PROMPT = """You are Aegis AI's AI-content detector. Analyze whether the following text was likely generated by an AI language model (ChatGPT, Claude, Gemini, etc.) and whether it is being used maliciously.

Consider:
- Overly polished grammar with generic phrasing
- Lack of personal voice, idioms, or human quirks
- Statistical hallmarks (common AI openers, structured bullet-like sentences)
- Consistency with scam-generated content (mass phishing, fake reviews, impersonation)
- Context: is this a message, review, email, or document?

Text:
---
{text}
---

Return ONLY valid JSON:
{{
  "ai_likelihood": <0-100>,
  "verdict": "<HUMAN | LIKELY_HUMAN | MIXED | LIKELY_AI | AI_GENERATED>",
  "malicious_use_likelihood": <0-100>,
  "indicators": [{{"indicator": "<name>", "detail": "<explanation>"}}],
  "writing_style": "<brief description>",
  "explanation": "<2-3 sentence plain English summary>",
  "confidence": <0-100>
}}"""


IMAGE_ANALYSIS_PROMPT = """You are Aegis AI's screenshot analyzer. The user uploaded a screenshot of a suspicious message, email, text, website, or notification.

Step 1: Read ALL visible text in the image (OCR).
Step 2: Analyze the extracted content for scam indicators (phishing, impersonation, fraud, deepfake, urgency tactics).
Step 3: Examine visual signals too — fake logos, suspicious URLs visible on screen, mismatched sender names, screenshot of a known phishing page design.

Return ONLY valid JSON:
{
  "extracted_text": "<all readable text from the image, one block>",
  "threat_score": <0-100>,
  "verdict": "<SAFE | SUSPICIOUS | LIKELY_SCAM | DANGEROUS>",
  "scam_type": "<primary category or 'None'>",
  "visual_red_flags": ["<visual indicator 1>", "<visual indicator 2>"],
  "red_flags": [{"flag": "<name>", "detail": "<explanation>", "severity": "<low|medium|high|critical>"}],
  "recommended_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "explanation": "<plain English 2-3 sentence summary of what the screenshot shows and why it is or isn't dangerous>",
  "confidence": <0-100>
}"""


CHAT_SYSTEM_PROMPT = """You are Aegis AI's chat assistant — an expert cybersecurity and anti-scam advisor.

Your job:
1. Help everyday people understand if a message, call, URL, or situation is a scam.
2. Teach scam patterns in plain English — never condescending.
3. If someone describes a scam they received, break down the red flags and tell them what to do.
4. If someone was already scammed, be kind, give concrete recovery steps (report to IC3.gov/FTC, call bank, freeze credit, change passwords).
5. Point users to the right Aegis tool (Message Scanner, URL Checker, Voice Analyzer, Screenshot Scanner, AI-text Detector) when it fits.

Rules:
- Be concise. Prefer short bulleted answers over long paragraphs.
- Never ask the user to share passwords, SSNs, card numbers, or other secrets.
- Default to protective advice: when in doubt, treat something as suspicious.
- When relevant, mention the exact Aegis tool to use (e.g. "paste it in the Message Scanner tab").
- Never give instructions for scamming, phishing, hacking, or any illegal activity. If asked, decline briefly.
- You are text-only here (no scanning). To actually scan, tell them to use the Aegis tool.

Format:
- Plain text, short paragraphs or bullet lists. No markdown headers. No code blocks unless truly needed.
- Keep answers under 180 words unless the user asks for depth.
"""


AUDIO_ANALYSIS_PROMPT = """You are Aegis AI's voice recording analyzer. The user has recorded an audio clip of a suspicious call, voicemail, or voice message.

Step 1: Transcribe the audio.
Step 2: Look for scam indicators: impersonation (IRS, Microsoft, bank, family), pressure tactics, gift-card / wire / crypto requests, voice-cloning hallmarks (robotic cadence, unnatural emotion, inconsistencies, background anomalies).
Step 3: Judge deepfake-voice likelihood from audio quality cues (if determinable).

Return ONLY valid JSON:
{
  "transcript": "<transcribed audio>",
  "threat_score": <0-100>,
  "verdict": "<SAFE | SUSPICIOUS | LIKELY_SCAM | DANGEROUS>",
  "scam_type": "<e.g. 'Grandparent Scam', 'IRS Impersonation', 'None'>",
  "deepfake_voice_likelihood": <0-100>,
  "voice_quality_notes": "<brief observation on cadence, naturalness>",
  "red_flags": [{"flag": "<name>", "detail": "<explanation>", "severity": "<low|medium|high|critical>"}],
  "recommended_actions": ["<action 1>", "<action 2>"],
  "explanation": "<2-3 sentence plain English summary>",
  "confidence": <0-100>
}"""


def _run_prompt(prompt: str) -> dict:
    client = _get_client()
    if not client:
        return {}
    try:
        resp = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=_gen_config,
        )
        return _extract_json(resp.text or "")
    except Exception as e:
        return {"__error__": str(e)}


def _run_multimodal(parts: list) -> dict:
    client = _get_client()
    if not client:
        return {}
    try:
        resp = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=parts,
            config=_gen_config_vision,
        )
        return _extract_json(resp.text or "")
    except Exception as e:
        return {"__error__": str(e)}


def analyze_message(message: str) -> dict:
    from . import featherless_service

    data = _run_prompt(SCAM_ANALYSIS_PROMPT.format(message=message))
    if not data or "__error__" in data:
        fallback = _mock_message_response(message)
        if data and "__error__" in data:
            fallback["error"] = data["__error__"]
        _log_scan("message", fallback["verdict"], fallback["threat_score"], message)
        return _attach_second_opinion(fallback, message, featherless_service)
    _log_scan("message", data.get("verdict", "UNKNOWN"), data.get("threat_score", 0), message)
    return _attach_second_opinion(data, message, featherless_service)


def _attach_second_opinion(primary: dict, message: str, featherless_service) -> dict:
    """Dual-shield: cross-check Gemini's verdict with Featherless's open-source LLM."""
    if not featherless_service.is_enabled():
        return primary
    second = featherless_service.second_opinion(message)
    if second and "error" not in second:
        primary["second_opinion"] = second
        # agreement flag
        primary["agreement"] = (
            primary.get("verdict") in (second.get("verdict"), None) or
            abs(primary.get("threat_score", 0) - second.get("threat_score", 0)) < 20
        )
    return primary


def analyze_url(url: str) -> dict:
    data = _run_prompt(URL_ANALYSIS_PROMPT.format(url=url))
    if not data or "__error__" in data:
        fallback = _mock_url_response(url)
        if data and "__error__" in data:
            fallback["error"] = data["__error__"]
        _log_scan("url", fallback["verdict"], fallback["threat_score"], url)
        return fallback
    _log_scan("url", data.get("verdict", "UNKNOWN"), data.get("threat_score", 0), url)
    return data


def analyze_call(transcript: str) -> dict:
    data = _run_prompt(CALL_ANALYSIS_PROMPT.format(transcript=transcript))
    if not data or "__error__" in data:
        fallback = _mock_call_response(transcript)
        if data and "__error__" in data:
            fallback["error"] = data["__error__"]
        _log_scan("call", fallback["verdict"], fallback["threat_score"], transcript)
        return fallback
    _log_scan("call", data.get("verdict", "UNKNOWN"), data.get("threat_score", 0), transcript)
    return data


def analyze_deepfake_text(text: str) -> dict:
    data = _run_prompt(DEEPFAKE_TEXT_PROMPT.format(text=text))
    if not data or "__error__" in data:
        fallback = _mock_deepfake_response(text)
        if data and "__error__" in data:
            fallback["error"] = data["__error__"]
        _log_scan("ai-text", fallback["verdict"], fallback["ai_likelihood"], text)
        return fallback
    _log_scan("ai-text", data.get("verdict", "UNKNOWN"), data.get("ai_likelihood", 0), text)
    return data


def analyze_image(image_bytes: bytes, mime_type: str = "image/png") -> dict:
    client = _get_client()
    if not client:
        return _mock_image_response()
    try:
        img_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        resp = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[IMAGE_ANALYSIS_PROMPT, img_part],
            config=_gen_config_vision,
        )
        data = _extract_json(resp.text or "")
        if not data:
            return _mock_image_response()
        _log_scan("screenshot", data.get("verdict", "UNKNOWN"), data.get("threat_score", 0), data.get("extracted_text", ""))
        return data
    except Exception as e:
        fallback = _mock_image_response()
        fallback["error"] = str(e)
        return fallback


def chat(messages: list) -> dict:
    """
    messages: [{"role": "user"|"assistant", "content": "..."}]
    Returns {"reply": "..."}
    Primary: Gemini. Fallback: Featherless (if configured). Else: heuristic.
    """
    from . import featherless_service

    client = _get_client()
    if not client:
        # Gemini unavailable — try Featherless
        fb = featherless_service.chat_reply(messages, CHAT_SYSTEM_PROMPT)
        if fb and "error" not in fb and fb.get("reply"):
            return fb
        return {"reply": _mock_chat_reply(messages), "offline_mode": True}
    try:
        # Convert history to Gemini format
        contents = []
        for m in messages:
            role = "user" if m.get("role") == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m.get("content", ""))]))

        cfg = types.GenerateContentConfig(
            temperature=0.5,
            top_p=0.95,
            max_output_tokens=600,
            system_instruction=CHAT_SYSTEM_PROMPT,
        )
        resp = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=cfg,
        )
        return {"reply": (resp.text or "").strip() or "Sorry — I couldn't come up with a response. Try rephrasing."}
    except Exception as e:
        return {"reply": _mock_chat_reply(messages), "offline_mode": True, "error": str(e)}


def _mock_chat_reply(messages: list) -> str:
    last = (messages[-1]["content"] if messages else "").lower()
    if any(k in last for k in ["hi", "hello", "hey", "yo"]):
        return "Hey! I'm Aegis — your anti-scam assistant. Describe the message, call, or situation and I'll help you spot the red flags. (Note: running in offline mode — add GEMINI_API_KEY for the full AI assistant.)"
    if any(k in last for k in ["scam", "phishing", "fraud", "fake"]):
        return "That sounds suspicious. Classic scam signs:\n• Urgency (act now, 24-hour deadline)\n• Payment via gift cards, wire, or crypto\n• Fake links or caller ID\n• Pressure to keep it secret\n\nPaste the message in the Message Scanner tab for a Gemini verdict in seconds. (Offline mode — add GEMINI_API_KEY for the full chat.)"
    if any(k in last for k in ["help", "what can you do", "features"]):
        return "I can:\n• Explain any scam pattern in plain English\n• Walk you through what to do if targeted\n• Point you to the right Aegis scanner (message, URL, call, screenshot, voice, AI-text)\n\nTry: 'I got a text from Chase saying my account is locked' and I'll break it down."
    return "I'm running in offline mode right now — add a Gemini API key to the backend .env to enable the full AI assistant. In the meantime, try the scanner tools above for real-time analysis."


def analyze_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> dict:
    client = _get_client()
    if not client:
        return _mock_audio_response()
    try:
        audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
        resp = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[AUDIO_ANALYSIS_PROMPT, audio_part],
            config=_gen_config_vision,
        )
        data = _extract_json(resp.text or "")
        if not data:
            return _mock_audio_response()
        _log_scan("voice", data.get("verdict", "UNKNOWN"), data.get("threat_score", 0), data.get("transcript", ""))
        return data
    except Exception as e:
        fallback = _mock_audio_response()
        fallback["error"] = str(e)
        return fallback


def _heuristic_score(text: str) -> int:
    score = 0
    lower = text.lower()
    triggers = [
        "urgent", "verify", "suspended", "click here", "wire transfer",
        "gift card", "bitcoin", "crypto", "bank account", "social security",
        "arrest", "warrant", "irs", "limited time", "congratulations",
        "winner", "prize", "lottery", "inheritance", "nigerian",
        "password", "login", "confirm your", "account locked", "unusual activity",
        "bail", "jail", "accident", "don't tell", "ceo", "wire",
    ]
    for t in triggers:
        if t in lower:
            score += 10
    if re.search(r"https?://\S+", text):
        score += 10
    if re.search(r"\$[0-9,]+", text):
        score += 8
    return min(score, 95)


def _mock_message_response(message: str) -> dict:
    score = _heuristic_score(message)
    verdict = "SAFE" if score < 25 else "SUSPICIOUS" if score < 55 else "LIKELY_SCAM" if score < 80 else "DANGEROUS"
    return {
        "threat_score": score,
        "verdict": verdict,
        "scam_type": "Phishing" if score > 40 else "None",
        "ai_generated_likelihood": 30,
        "red_flags": [
            {"flag": "Heuristic match", "detail": "Message contains common scam keywords", "severity": "medium"}
        ] if score > 25 else [],
        "recommended_actions": [
            "Do not click any links",
            "Verify the sender through an official channel",
            "Report the message as spam",
        ],
        "explanation": "Running in offline heuristic mode (no Gemini API key). Add GEMINI_API_KEY for full AI analysis.",
        "confidence": 50,
        "offline_mode": True,
    }


def _mock_url_response(url: str) -> dict:
    score = 20
    lower = url.lower()
    sus = ["bit.ly", "tinyurl", ".xyz", ".top", ".click", ".zip", "paypa1", "g00gle", "amaz0n", "login-", "-verify", "-secure"]
    for s in sus:
        if s in lower:
            score += 20
    score = min(score, 95)
    verdict = "SAFE" if score < 25 else "SUSPICIOUS" if score < 55 else "LIKELY_PHISHING" if score < 80 else "DANGEROUS"
    return {
        "threat_score": score,
        "verdict": verdict,
        "category": "unknown",
        "impersonating": "none",
        "red_flags": [],
        "recommendation": "Add a Gemini API key for full URL threat analysis.",
        "safe_alternative": "none",
        "confidence": 50,
        "offline_mode": True,
    }


def _mock_call_response(transcript: str) -> dict:
    score = _heuristic_score(transcript)
    verdict = "SAFE" if score < 25 else "SUSPICIOUS" if score < 55 else "LIKELY_SCAM" if score < 80 else "DANGEROUS"
    return {
        "threat_score": score,
        "verdict": verdict,
        "scam_type": "Tech Support Scam" if "microsoft" in transcript.lower() else "Unknown",
        "deepfake_voice_likelihood": 25,
        "red_flags": [],
        "tactics_used": ["Urgency", "Authority"] if score > 40 else [],
        "recommended_actions": ["Hang up", "Call back using an official number"],
        "explanation": "Offline heuristic mode. Add GEMINI_API_KEY for full voice-call analysis.",
        "confidence": 50,
        "offline_mode": True,
    }


def _mock_deepfake_response(text: str) -> dict:
    length = len(text)
    score = 50 if length > 200 else 30
    verdict = "LIKELY_AI" if score > 60 else "MIXED"
    return {
        "ai_likelihood": score,
        "verdict": verdict,
        "malicious_use_likelihood": 20,
        "indicators": [],
        "writing_style": "Unable to analyze without Gemini API key.",
        "explanation": "Offline heuristic mode. Add GEMINI_API_KEY for full AI-text detection.",
        "confidence": 40,
        "offline_mode": True,
    }


def _mock_image_response() -> dict:
    return {
        "extracted_text": "(Offline mode — image text extraction requires Gemini)",
        "threat_score": 50,
        "verdict": "SUSPICIOUS",
        "scam_type": "Unknown",
        "visual_red_flags": ["Image analysis requires Gemini API key"],
        "red_flags": [
            {"flag": "Offline mode", "detail": "Set GEMINI_API_KEY to enable screenshot analysis", "severity": "low"}
        ],
        "recommended_actions": ["Add a Gemini API key to backend/.env"],
        "explanation": "Running in offline mode. Full screenshot & OCR analysis requires the Gemini vision model.",
        "confidence": 30,
        "offline_mode": True,
    }


def _mock_audio_response() -> dict:
    return {
        "transcript": "(Offline mode — audio transcription requires Gemini)",
        "threat_score": 50,
        "verdict": "SUSPICIOUS",
        "scam_type": "Unknown",
        "deepfake_voice_likelihood": 50,
        "voice_quality_notes": "Unable to analyze without Gemini.",
        "red_flags": [
            {"flag": "Offline mode", "detail": "Set GEMINI_API_KEY to enable voice analysis", "severity": "low"}
        ],
        "recommended_actions": ["Add a Gemini API key to backend/.env"],
        "explanation": "Running in offline mode. Full voice transcription & deepfake detection requires Gemini.",
        "confidence": 30,
        "offline_mode": True,
    }
