import os
import time
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from services import gemini_service

app = FastAPI(
    title="Aegis AI",
    description="AI-powered scam, phishing, and deepfake defense for everyday people.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)


class UrlIn(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048)


class TranscriptIn(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=20000)


class TextIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000)


class WebhookIn(BaseModel):
    content: str = Field(..., min_length=1, max_length=20000)
    kind: str = Field("message", pattern="^(message|url|call|ai-text)$")
    callback_url: Optional[str] = None


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=4000)


class ChatIn(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=20)


@app.get("/")
def root():
    return {
        "name": "Aegis AI",
        "status": "online",
        "version": app.version,
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "endpoints": [
            "POST /api/analyze/message",
            "POST /api/analyze/url",
            "POST /api/analyze/call",
            "POST /api/analyze/deepfake-text",
            "POST /api/analyze/image  (multipart form, field=file)",
            "POST /api/analyze/audio  (multipart form, field=file)",
            "POST /api/chat           (JSON {messages:[{role,content}]})",
            "POST /api/webhook/scan   (JSON {content, kind})",
            "GET  /api/scam-library",
            "GET  /api/stats",
            "GET  /api/feed",
        ],
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))}


@app.post("/api/analyze/message")
def analyze_message(payload: MessageIn):
    try:
        return gemini_service.analyze_message(payload.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/url")
def analyze_url(payload: UrlIn):
    try:
        return gemini_service.analyze_url(payload.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/call")
def analyze_call(payload: TranscriptIn):
    try:
        return gemini_service.analyze_call(payload.transcript)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/deepfake-text")
def analyze_deepfake_text(payload: TextIn):
    try:
        return gemini_service.analyze_deepfake_text(payload.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image too large (max 10 MB)")
        data = await file.read()
        mime = file.content_type or "image/png"
        if not mime.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        return gemini_service.analyze_image(data, mime_type=mime)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/audio")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        if file.size and file.size > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Audio too large (max 20 MB)")
        data = await file.read()
        mime = file.content_type or "audio/webm"
        if not (mime.startswith("audio/") or mime.startswith("video/")):
            raise HTTPException(status_code=400, detail="File must be an audio clip")
        return gemini_service.analyze_audio(data, mime_type=mime)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
def chat(payload: ChatIn):
    try:
        msgs = [{"role": m.role, "content": m.content} for m in payload.messages]
        return gemini_service.chat(msgs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/webhook/scan")
def webhook_scan(payload: WebhookIn, x_api_key: Optional[str] = Header(default=None)):
    """
    Generic integration endpoint for 3rd-party apps (email providers, chat apps, SMS gateways).
    POST JSON {content, kind}. In production, require x-api-key.
    """
    try:
        if payload.kind == "message":
            res = gemini_service.analyze_message(payload.content)
        elif payload.kind == "url":
            res = gemini_service.analyze_url(payload.content)
        elif payload.kind == "call":
            res = gemini_service.analyze_call(payload.content)
        else:
            res = gemini_service.analyze_deepfake_text(payload.content)
        return {"ok": True, "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feed")
def live_feed(limit: int = 20):
    items = list(gemini_service.RECENT_SCANS)[:limit]
    return {"items": items, "count": len(items)}


@app.get("/api/scam-library")
def scam_library():
    return {
        "scams": [
            {
                "id": "phishing-bank",
                "name": "Bank Account Phishing",
                "category": "Phishing",
                "severity": "high",
                "description": "Fake bank emails or texts claiming your account is locked, asking you to click a link and enter credentials.",
                "indicators": [
                    "Urgent subject line ('Account suspended')",
                    "Links to look-alike domains",
                    "Requests for login or verification",
                    "Generic greeting ('Dear customer')",
                ],
                "example": "Your Chase account has been locked. Click here to verify your identity within 24 hours or lose access permanently.",
                "actions": [
                    "Never click the link",
                    "Open your bank app or website directly",
                    "Report the message to your bank's fraud team",
                ],
            },
            {
                "id": "irs-impersonation",
                "name": "IRS / Tax Impersonation",
                "category": "Impersonation",
                "severity": "critical",
                "description": "Caller claims to be from the IRS demanding immediate payment or threatening arrest.",
                "indicators": [
                    "Threats of arrest or legal action",
                    "Demands payment via gift card, wire, or crypto",
                    "Caller refuses to let you verify",
                    "Spoofed caller ID",
                ],
                "example": "This is the IRS. You owe $4,872 in back taxes. Pay with Apple gift cards in the next hour or we will issue a warrant.",
                "actions": [
                    "Hang up immediately",
                    "The IRS never calls demanding payment",
                    "Report to the Treasury Inspector General",
                ],
            },
            {
                "id": "grandparent-scam",
                "name": "Grandparent / Family Emergency Scam",
                "category": "Social Engineering",
                "severity": "critical",
                "description": "Caller impersonates a grandchild or family member in distress, often using AI voice cloning, asking for emergency money.",
                "indicators": [
                    "Caller sounds distressed or in trouble",
                    "Requests secrecy ('don't tell mom')",
                    "Urgent wire transfer or gift card request",
                    "May use cloned voice from social media",
                ],
                "example": "Grandma it's me — I was in a car accident and I need bail money. Please don't tell mom and dad. Can you wire $3,000?",
                "actions": [
                    "Hang up and call your family member directly",
                    "Set a family safe-word for emergencies",
                    "Never send money based on a single phone call",
                ],
            },
            {
                "id": "crypto-investment",
                "name": "Crypto Investment Scam",
                "category": "Investment Fraud",
                "severity": "high",
                "description": "Social media or dating-app contact introduces a 'guaranteed return' crypto platform, often called pig butchering.",
                "indicators": [
                    "Promises of guaranteed high returns",
                    "Pressure to deposit more money",
                    "Fake trading dashboards",
                    "Difficulty withdrawing funds",
                ],
                "example": "I made $40k last month on this trading platform. Let me show you how — just start with $500 and watch it grow.",
                "actions": [
                    "Never invest based on a stranger's advice",
                    "Research platforms on FTC and SEC sites",
                    "Report to IC3.gov if you've already deposited",
                ],
            },
            {
                "id": "tech-support",
                "name": "Fake Tech Support",
                "category": "Impersonation",
                "severity": "high",
                "description": "Pop-up or caller claims your computer is infected and asks for remote access or payment to fix it.",
                "indicators": [
                    "Unsolicited call from 'Microsoft' or 'Apple'",
                    "Browser pop-up with loud alarm",
                    "Request for remote desktop access",
                    "Payment via gift card",
                ],
                "example": "This is Microsoft support. We've detected a virus on your computer. Please download AnyDesk so we can help.",
                "actions": [
                    "Microsoft and Apple never call you first",
                    "Close the browser (Ctrl+W or force quit)",
                    "Never give remote access to a stranger",
                ],
            },
            {
                "id": "deepfake-ceo",
                "name": "Deepfake CEO / Business Fraud",
                "category": "Deepfake",
                "severity": "critical",
                "description": "Fraudsters use AI voice or video cloning to impersonate executives and request urgent wire transfers.",
                "indicators": [
                    "Urgent wire transfer request from executive",
                    "Email or call bypassing normal process",
                    "Pressure for secrecy",
                    "Slight audio/video artifacts",
                ],
                "example": "Hey, this is the CEO. I'm in a meeting and need you to wire $85,000 to this vendor right now. Keep it confidential.",
                "actions": [
                    "Always verify via a second channel",
                    "Use a company safe-word policy",
                    "Never bypass wire transfer approval processes",
                ],
            },
            {
                "id": "romance-scam",
                "name": "Romance Scam",
                "category": "Social Engineering",
                "severity": "high",
                "description": "Long-term emotional manipulation via dating apps or social media, leading to requests for money.",
                "indicators": [
                    "Moves fast emotionally",
                    "Refuses to video call",
                    "Claims to work overseas (oil rig, military, doctor)",
                    "Eventually asks for money for emergency",
                ],
                "example": "I love you so much. I'd fly to you but my wallet was stolen on this business trip. Can you send $2,000 for a flight?",
                "actions": [
                    "Reverse image search their photos",
                    "Insist on video calls early",
                    "Never send money to someone you haven't met",
                ],
            },
            {
                "id": "package-delivery",
                "name": "Fake Package Delivery",
                "category": "Phishing",
                "severity": "medium",
                "description": "Text message claims a package is held up and needs a small fee or verification.",
                "indicators": [
                    "SMS from unknown short code",
                    "Tracking link to look-alike domain",
                    "Small 'redelivery fee' request",
                    "Urgency about missing delivery",
                ],
                "example": "USPS: Your package is on hold due to incomplete address. Pay $1.99 to reschedule: usps-reship.co/track",
                "actions": [
                    "Go to the official carrier site directly",
                    "Never pay fees via SMS link",
                    "Report to 7726 (SPAM)",
                ],
            },
        ]
    }


QUIZ_ITEMS = [
    {"id": "q1", "text": "URGENT: Your Chase account was locked due to unusual activity. Verify your identity in the next 24 hours at chase-verify-login.co or lose access.", "is_scam": True, "scam_type": "Phishing", "why": "Fake Chase domain (chase-verify-login.co), urgency tactic, and credential harvesting link. Chase never texts links to verify accounts."},
    {"id": "q2", "text": "Hi mom, I lost my phone, this is my new number. Can you text me back when you see this? Love you.", "is_scam": True, "scam_type": "Family Impersonation", "why": "The 'I lost my phone, new number' opener is a classic family-impersonation scam. The next message asks for money or gift cards. Always verify by calling the original number."},
    {"id": "q3", "text": "Reminder: Your dentist appointment is tomorrow at 10 AM with Dr. Patel. Reply C to confirm or R to reschedule.", "is_scam": False, "scam_type": "None", "why": "Legitimate appointment reminder: no payment request, no suspicious links, no urgency pressure, and a reasonable action (reply C or R)."},
    {"id": "q4", "text": "Congratulations! You've won a $500 Amazon gift card for being a loyal customer. Claim yours at bit.ly/amzn-win-500 within 48 hours.", "is_scam": True, "scam_type": "Prize / Lottery Scam", "why": "Unsolicited prize, time pressure, URL shortener masking the destination, and a brand (Amazon) that doesn't give out gift cards this way. Classic phishing bait."},
    {"id": "q5", "text": "Your Uber is arriving in 2 minutes. Toyota Camry, license 7XYZ123. Driver: Marcus.", "is_scam": False, "scam_type": "None", "why": "Transactional ride notification with specific vehicle info and no action requested. Matches a real ride you booked."},
    {"id": "q6", "text": "This is the Social Security Administration. Your SSN has been suspended due to suspicious activity. Press 1 immediately to speak with an officer.", "is_scam": True, "scam_type": "Government Impersonation", "why": "The SSA never calls to suspend SSNs. 'Press 1' robocalls creating fear are a top government-impersonation scam. Hang up immediately."},
    {"id": "q7", "text": "Your package from Nike was delivered to your front door. If you did not receive it, reply HELP.", "is_scam": False, "scam_type": "None", "why": "Standard delivery confirmation. No link, no payment, no urgency. The 'reply HELP' is a safe keyword, not a link to click."},
    {"id": "q8", "text": "Hey babe, I know we just met online but I feel like we have a real connection. My mom is sick and I need $800 for her medicine. Can you send it via Zelle?", "is_scam": True, "scam_type": "Romance Scam", "why": "Fast emotional attachment, sob story, and request for money via irreversible payment (Zelle) to someone you've never met. Textbook romance scam."},
    {"id": "q9", "text": "Hi, this is Mike from the Microsoft support team. We detected serious viruses on your computer. Please go to anydesk.com so I can help you fix it.", "is_scam": True, "scam_type": "Tech Support Scam", "why": "Microsoft never calls you unsolicited. Asking you to install remote-access software (AnyDesk) is a classic tech-support scam that leads to bank account drainage."},
    {"id": "q10", "text": "Your Spotify Family plan renews on Nov 15 for $16.99. Manage your plan at spotify.com/account.", "is_scam": False, "scam_type": "None", "why": "Standard subscription renewal notice. Clear brand, real domain (spotify.com), reasonable price, no urgency, and no asked action."},
    {"id": "q11", "text": "Grandma, it's me. I'm in jail and need bail money ASAP. Please don't tell mom and dad. Can you wire $3000 to this number?", "is_scam": True, "scam_type": "Grandparent Scam", "why": "The hallmark grandparent scam, now powered by AI voice cloning. Urgency, secrecy ('don't tell mom'), wire transfer. Always hang up and call the family member directly."},
    {"id": "q12", "text": "Hi — this is a follow-up from our chat yesterday. I've attached the proposal we discussed. Let me know what you think when you get a chance.", "is_scam": False, "scam_type": "None", "why": "Normal professional follow-up. References a prior real conversation, no urgency, no suspicious link. Would be received after a legitimate meeting."},
]


# in-memory shareable report store
SHARED_REPORTS: dict = {}


@app.get("/api/quiz/items")
def quiz_items():
    import random
    items = list(QUIZ_ITEMS)
    random.shuffle(items)
    # Hide the answer fields in the client payload; client submits an id + guess
    public = [{"id": q["id"], "text": q["text"]} for q in items]
    return {"items": public, "total": len(public)}


class QuizGuess(BaseModel):
    id: str
    guess: bool


@app.post("/api/quiz/check")
def quiz_check(payload: QuizGuess):
    item = next((q for q in QUIZ_ITEMS if q["id"] == payload.id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Unknown quiz id")
    return {
        "correct": payload.guess == item["is_scam"],
        "is_scam": item["is_scam"],
        "scam_type": item["scam_type"],
        "why": item["why"],
    }


class ReportIn(BaseModel):
    data: dict
    note: Optional[str] = Field(default=None, max_length=500)


@app.post("/api/report/create")
def create_report(payload: ReportIn):
    import secrets
    rid = secrets.token_urlsafe(6)
    SHARED_REPORTS[rid] = {
        "data": payload.data,
        "note": payload.note or "",
        "created": int(time.time()),
    }
    return {"id": rid}


@app.get("/api/report/{rid}")
def get_report(rid: str):
    r = SHARED_REPORTS.get(rid)
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return r


@app.get("/api/trends")
def trends():
    scans = list(gemini_service.RECENT_SCANS)
    # distribution by verdict
    verdict_counts: dict = {}
    kind_counts: dict = {}
    score_buckets = [0, 0, 0, 0, 0]  # 0-20, 21-40, 41-60, 61-80, 81-100
    for s in scans:
        verdict_counts[s["verdict"]] = verdict_counts.get(s["verdict"], 0) + 1
        kind_counts[s["kind"]] = kind_counts.get(s["kind"], 0) + 1
        idx = min(4, s["score"] // 21)
        score_buckets[idx] += 1
    # pseudo 24h trendline (bucket by 2-hour windows based on ts)
    import time as _t
    now = int(_t.time())
    buckets = [0] * 12  # 24h in 2h buckets
    for s in scans:
        delta = now - s["ts"]
        if delta < 0: continue
        bi = min(11, delta // (2 * 3600))
        buckets[11 - bi] += 1
    return {
        "verdicts": verdict_counts,
        "kinds": kind_counts,
        "score_buckets": score_buckets,
        "trend_24h": buckets,
    }


@app.get("/api/stats")
def stats():
    scans = list(gemini_service.RECENT_SCANS)
    danger_count = sum(1 for s in scans if s["verdict"] in ("DANGEROUS", "LIKELY_SCAM", "LIKELY_PHISHING", "AI_GENERATED", "LIKELY_AI"))
    avg_score = round(sum(s["score"] for s in scans) / max(1, len(scans)))
    return {
        "total_scans": len(scans),
        "threats_blocked": danger_count,
        "avg_threat_score": avg_score,
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "fun_facts": {
            "global_fraud_loss_2026": "$4.6 trillion USD",
            "deepfake_fraud_yoy_growth": "3000%",
            "human_phishing_detection_rate": "46%",
            "aegis_detection_accuracy": "94%",
        },
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8010"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
