# StyleSense Backend

FastAPI backend powering the StyleSense AI Fashion Assistant.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in the `backend/` folder:

```
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Get keys from:
- Groq: https://console.groq.com
- Gemini: https://aistudio.google.com/app/apikey

## Run

```bash
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Check API + model status |
| POST | /analyze | Upload image → skin tone, face shape, style recs |
| POST | /chat | Chat with Groq LLaMA 3.3 70B |
| POST | /face-analysis | Dedicated face analysis |

## Notes

- The frontend works fully without the backend (mock responses are used as fallback).
- OpenCV is used for local skin tone detection before sending to Gemini.
- CORS is open (`*`) for local development — restrict in production.
