# StyleSense – Generative AI Fashion Assistant

StyleSense is a full-stack AI-powered fashion assistant that analyzes your photo to detect skin tone, face shape, and style profile, then provides personalized outfit recommendations. It also features an AI chatbot with text-to-speech voice output.

---

## Features

- **AI Image Analysis** – Upload a photo to detect skin tone, face shape, seasonal palette, and style profile using Groq Vision (LLaMA 4 Scout) and Google Gemini
- **Personalized Recommendations** – Get outfit and color recommendations tailored to your analysis
- **AI Chatbot** – Chat with StyleSense AI (Groq LLaMA 3.3 70B) for fashion advice
- **Text-to-Speech** – AI responses are spoken aloud using the backend TTS engine (macOS `say` / pyttsx3), with a mute toggle
- **Voice Input** – Speak your questions using the Web Speech API
- **Face Analysis** – Dedicated face shape and undertone detection endpoint

---

## Project Structure

```
Style-Sense/
├── index.html          # Main frontend (single-page HTML app)
├── script.js           # Frontend logic (upload, chatbot, TTS, animations)
├── styles-base.css     # All CSS styles
├── sections/           # HTML section partials
├── backend/
│   ├── main.py         # FastAPI backend (analyze, chat, tts, face-analysis)
│   ├── requirements.txt
│   └── .env            # API keys (not committed)
└── style-sense/        # Next.js app (optional frontend scaffold)
```

---

## Tech Stack

### Frontend
- Vanilla HTML, CSS, JavaScript
- Web Speech API (voice input)
- Firebase Storage (image upload & URL generation)

### Backend
- **FastAPI** + **Uvicorn**
- **Groq** – LLaMA 4 Scout (vision) + LLaMA 3.3 70B (chat)
- **Google Gemini** – `gemini-2.0-flash-lite` (vision fallback)
- **OpenCV** – skin tone detection
- **pyttsx3** / macOS `say` – text-to-speech
- **Python 3.14+**

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/Akshithanamaji/Tech-Innovators.git
cd Tech-Innovators
```

### 2. Backend setup

```bash
cd backend
pip3 install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend setup

Serve the root `index.html` with any static file server:

```bash
python3 -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check – shows Groq, Gemini, OpenCV status |
| `POST` | `/analyze` | Analyze uploaded image for skin tone, face shape, style |
| `POST` | `/chat` | Chat with StyleSense AI |
| `POST` | `/tts` | Convert text to speech, returns WAV audio |
| `POST` | `/face-analysis` | Dedicated face shape & undertone analysis |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key (get from [console.groq.com](https://console.groq.com)) |
| `GEMINI_API_KEY` | Google Gemini API key (get from [aistudio.google.com](https://aistudio.google.com)) |

---

## Getting API Keys

- **Groq**: Sign up at [console.groq.com](https://console.groq.com) → API Keys → Create key
- **Gemini**: Visit [aistudio.google.com](https://aistudio.google.com) → Get API key

---

## License

MIT License – feel free to use and modify.