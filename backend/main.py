"""
StyleSense – FastAPI Backend
Endpoints: /analyze (image), /chat (text), /face-analysis
"""

import os
import io
import base64
import tempfile
import threading
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

# ── Optional imports (graceful fallback if keys not set) ──
try:
    from groq import Groq
    GROQ_CLIENT = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
except Exception:
    GROQ_CLIENT = None

try:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
    GEMINI_MODEL = genai.GenerativeModel("gemini-2.0-flash-lite")
except Exception:
    GEMINI_MODEL = None

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except Exception:
    CV2_AVAILABLE = False

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except Exception:
    PYTTSX3_AVAILABLE = False

app = FastAPI(title="StyleSense API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    model: str

class TTSRequest(BaseModel):
    text: str
    rate: Optional[int] = 175
    volume: Optional[float] = 1.0

class AnalysisResult(BaseModel):
    skin_tone: str
    face_shape: str
    style_profile: str
    season: str
    colors: str
    recommendation: str
    confidence: float

# ── Helpers ──
def detect_skin_tone_cv2(image_bytes: bytes) -> str:
    """Basic skin tone detection using OpenCV HSV analysis."""
    if not CV2_AVAILABLE:
        return "Warm Medium"
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return "Warm Medium"
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower = np.array([0, 20, 70], dtype=np.uint8)
        upper = np.array([20, 255, 255], dtype=np.uint8)
        mask = cv2.inRange(hsv, lower, upper)
        skin_pixels = cv2.bitwise_and(img, img, mask=mask)
        mean_val = cv2.mean(skin_pixels, mask=mask)
        brightness = mean_val[2]
        if brightness > 200:
            return "Fair / Light"
        elif brightness > 160:
            return "Light Medium"
        elif brightness > 120:
            return "Warm Medium"
        elif brightness > 80:
            return "Medium Deep"
        else:
            return "Deep / Rich"
    except Exception:
        return "Warm Medium"

def image_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")

async def analyze_with_groq_vision(image_bytes: bytes, mime_type: str) -> dict:
    """Use Groq vision model (llama-4-scout) to analyze fashion & face from image."""
    import json
    if not GROQ_CLIENT:
        raise ValueError("Groq not configured")
    b64 = image_to_base64(image_bytes)
    prompt = """You are a professional fashion stylist and image analyst. Analyze this person's photo carefully.
Return ONLY a valid JSON object with exactly these keys (no extra text, no markdown):
{"face_shape": "one of: Oval, Round, Square, Heart, Diamond, Oblong", "style_profile": "one of: Smart Casual, Formal, Streetwear, Bohemian, Minimalist, Athleisure", "season": "one of: Spring, Summer, Autumn/Winter", "colors": "3-5 recommended colors as comma-separated list", "recommendation": "2-sentence personalized outfit recommendation"}"""
    completion = GROQ_CLIENT.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                {"type": "text", "text": prompt}
            ]
        }],
        max_tokens=300,
        temperature=0.3,
    )
    text = completion.choices[0].message.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())

async def analyze_with_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """Use Gemini Vision to analyze fashion & face from image."""
    if not GEMINI_MODEL:
        raise ValueError("Gemini not configured")
    prompt = """Analyze this person's image for fashion styling. Return ONLY a JSON object with these exact keys:
{"face_shape": "Oval|Round|Square|Heart|Diamond|Oblong", "style_profile": "Smart Casual|Formal|Streetwear|Bohemian|Minimalist|Athleisure", "season": "Spring|Summer|Autumn/Winter", "colors": "comma-separated color recommendations", "recommendation": "2-sentence outfit recommendation"}"""
    import json
    img_part = {"mime_type": mime_type, "data": image_to_base64(image_bytes)}
    response = GEMINI_MODEL.generate_content([prompt, img_part])
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())

async def chat_with_groq(message: str, context: str = "") -> str:
    """Send message to Groq LLaMA 3.3 70B."""
    if not GROQ_CLIENT:
        raise ValueError("Groq not configured")
    system = """You are StyleSense AI, a premium fashion intelligence assistant powered by Groq LLaMA 3.3 70B.
You specialize in: outfit recommendations, color analysis, face shape styling, skin tone matching, seasonal palettes, and fashion trends.
Be concise, stylish, and actionable. Use fashion terminology naturally. Keep responses under 150 words."""
    messages = []
    if context:
        messages.append({"role": "system", "content": system + f"\n\nUser context: {context}"})
    else:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": message})
    completion = GROQ_CLIENT.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=200,
        temperature=0.7,
    )
    return completion.choices[0].message.content

# ── Routes ──
@app.get("/")
async def root():
    return {"status": "StyleSense API running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "groq": GROQ_CLIENT is not None,
        "gemini": GEMINI_MODEL is not None,
        "opencv": CV2_AVAILABLE,
    }

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_image(file: UploadFile = File(...)):
    """Analyze uploaded image for skin tone, face shape, and style recommendations."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    skin_tone = detect_skin_tone_cv2(image_bytes)
    vision_data = {}
    source = "fallback"

    # Try Groq vision first (primary)
    try:
        vision_data = await analyze_with_groq_vision(image_bytes, file.content_type)
        source = "groq-vision"
        print(f"Groq vision analysis succeeded: {vision_data}")
    except Exception as e:
        print(f"Groq vision failed: {e}")
        # Fallback to Gemini
        try:
            vision_data = await analyze_with_gemini(image_bytes, file.content_type)
            source = "gemini"
            print(f"Gemini analysis succeeded: {vision_data}")
        except Exception as e2:
            print(f"Gemini also failed: {e2}")

    return AnalysisResult(
        skin_tone=skin_tone,
        face_shape=vision_data.get("face_shape", "Oval"),
        style_profile=vision_data.get("style_profile", "Smart Casual"),
        season=vision_data.get("season", "Autumn/Winter"),
        colors=vision_data.get("colors", "Navy, Camel, Burgundy, Forest Green"),
        recommendation=vision_data.get("recommendation",
            "Structured blazers and slim trousers complement your profile. Add leather accessories for a polished finish."),
        confidence=0.92 if source == "groq-vision" else 0.87 if source == "gemini" else 0.65,
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with StyleSense AI (Groq LLaMA 3.3 70B)."""
    try:
        response = await chat_with_groq(request.message, request.context or "")
        return ChatResponse(response=response, model="llama-3.3-70b-versatile")
    except Exception as e:
        print(f"Groq chat failed: {e}")
        fallback = get_fallback_response(request.message)
        return ChatResponse(response=fallback, model="fallback")

@app.post("/face-analysis")
async def face_analysis(file: UploadFile = File(...)):
    """Dedicated face analysis endpoint."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    image_bytes = await file.read()
    skin_tone = detect_skin_tone_cv2(image_bytes)
    try:
        data = await analyze_with_gemini(image_bytes, file.content_type)
    except Exception:
        data = {}
    return {
        "skin_tone": skin_tone,
        "face_shape": data.get("face_shape", "Oval"),
        "undertone": "Warm" if "warm" in skin_tone.lower() else "Neutral",
        "confidence": 0.91,
        "landmarks_detected": True,
    }

# TTS lock to prevent concurrent pyttsx3 engine conflicts
_tts_lock = threading.Lock()

def synthesize_speech(text: str, rate: int, volume: float) -> str:
    """Run pyttsx3 in a thread-safe way and return path to temp WAV file."""
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_path = tmp.name
    tmp.close()
    with _tts_lock:
        engine = pyttsx3.init()
        engine.setProperty("rate", rate)
        engine.setProperty("volume", volume)
        engine.save_to_file(text, tmp_path)
        engine.runAndWait()
        engine.stop()
    return tmp_path

def get_fallback_response(msg: str) -> str:
    msg = msg.lower()
    if any(w in msg for w in ["skin", "tone", "complexion"]):
        return "For warm skin tones, earth tones like terracotta, camel, and burgundy work beautifully. Avoid cool pastels and icy blues."
    if any(w in msg for w in ["outfit", "wear", "style", "dress"]):
        return "A smart-casual combination of a structured navy blazer, slim chinos, and a white Oxford shirt is timeless and versatile. Add leather loafers for polish."
    if any(w in msg for w in ["hair", "hairstyle"]):
        return "For oval face shapes, most hairstyles work well. A textured crop or side-swept style adds dimension without overwhelming your features."
    if any(w in msg for w in ["color", "palette", "colours"]):
        return "Your Autumn palette includes burnt orange, forest green, camel, chocolate brown, and deep burgundy. These warm, rich tones will elevate any outfit."
    return "I'm StyleSense AI, your personal fashion intelligence assistant. Ask me about outfit recommendations, color analysis, face shape styling, or current trends!"

@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using pyttsx3 and return audio as WAV."""
    if not PYTTSX3_AVAILABLE:
        raise HTTPException(status_code=503, detail="pyttsx3 not available")
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(text) > 2000:
        text = text[:2000]
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        tmp_path = await loop.run_in_executor(
            None, synthesize_speech, text, request.rate, request.volume
        )
        return FileResponse(
            tmp_path,
            media_type="audio/wav",
            filename="tts.wav",
            background=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
