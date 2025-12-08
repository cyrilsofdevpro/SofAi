from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel
import os
from fastapi.middleware.cors import CORSMiddleware
# Import lightweight helpers (these don't import heavy HF deps)
try:
    from .utils import verify_api_key
    from .storage import ChatStore
except Exception:
    from utils import verify_api_key
    from storage import ChatStore


    # Dry-run dummy model used when full HF dependencies are not installed or for quick testing.
class _DummyModel:
    def __init__(self):
        self.device = "cpu"

    def generate_response(self, prompt: str, max_new_tokens: int = 256, **kwargs):
        return f"[dry-run reply] I received: {prompt[:200]}"

app = FastAPI(title="SofAI Backend")

# Enable CORS for local development. Lock this down in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.getenv("MODEL_NAME", "mistral-7b-instruct")
MODEL_TRUST_REMOTE = os.getenv("MODEL_TRUST_REMOTE", "false").lower() in ("1", "true", "yes")
MODEL_LOAD_8BIT = os.getenv("MODEL_LOAD_8BIT", "false").lower() in ("1", "true", "yes")
MODEL_REVISION = os.getenv("MODEL_REVISION") or None
from typing import Any

model: Any = None


class ChatRequest(BaseModel):
    message: str
    max_tokens: int = 80  # even shorter for focused answers


class ChatResponse(BaseModel):
    reply: str


@app.on_event("startup")
async def startup_event():
    global model
    # If SKIP_MODEL_LOAD is set, use the lightweight dummy model for quick local testing
    skip = os.getenv("SKIP_MODEL_LOAD", "0").lower() in ("1", "true", "yes")
    if skip:
        model = _DummyModel()
        return

    # Import the model loader lazily to avoid importing heavy HF libraries at module import time
    try:
        from .model_loader import ModelWrapper
    except Exception:
        from model_loader import ModelWrapper

    model = ModelWrapper.load_cached(MODEL_NAME, trust_remote_code=MODEL_TRUST_REMOTE, load_in_8bit=MODEL_LOAD_8BIT, revision=MODEL_REVISION)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request, api_key: str = Depends(verify_api_key)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    # store user message in session history (optional)
    session_id = request.headers.get('x-session-id', 'default')
    ChatStore.add_message(session_id, {"role": "user", "text": req.message})

    # Shortcut canned responses for simple, common questions to avoid unnecessary model calls
    raw = (req.message or '').strip()
    normalized = ''.join(ch for ch in raw.lower() if ch.isalnum() or ch.isspace()).strip()
    if normalized:
        if 'who are you' in normalized or 'what is your name' in normalized or normalized == 'whoami':
            canned = 'I am SofAi, created by the Sofdev Team'
            ChatStore.add_message(session_id, {"role": "bot", "text": canned})
            return ChatResponse(reply=canned)

    # Format prompt for Qwen chat model
    # Qwen expects: "User: {question}\nAssistant:"
    formatted_prompt = f"User: {req.message}\nAssistant:"

    # Generate response with improved parameters for instruction-tuned models
    reply = model.generate_response(
        formatted_prompt,
        max_new_tokens=req.max_tokens,
        temperature=0.3,  # even lower for more focused, deterministic answers
        top_p=0.7,        # even tighter nucleus sampling
    )

    ChatStore.add_message(session_id, {"role": "bot", "text": reply})
    return ChatResponse(reply=reply)


@app.post("/predict")
async def predict(req: ChatRequest, request: Request):
    """Lightweight prediction endpoint for simple frontends and ngrok tunnels.
    This endpoint intentionally does not require API key authentication (meant for local testing).
    It returns JSON {"reply": str} so simple clients can consume it.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    session_id = request.headers.get('x-session-id', 'default')
    ChatStore.add_message(session_id, {"role": "user", "text": req.message})

    # reuse the same canned-response logic used by /chat
    raw = (req.message or '').strip()
    normalized = ''.join(ch for ch in raw.lower() if ch.isalnum() or ch.isspace()).strip()
    if normalized:
        if 'who are you' in normalized or 'what is your name' in normalized or normalized == 'whoami':
            canned = 'I am SofAi, created by the Sofdev Team'
            ChatStore.add_message(session_id, {"role": "bot", "text": canned})
            return {"reply": canned}

    formatted_prompt = f"User: {req.message}\nAssistant:"
    reply = model.generate_response(
        formatted_prompt,
        max_new_tokens=req.max_tokens,
        temperature=0.3,
        top_p=0.7,
    )

    ChatStore.add_message(session_id, {"role": "bot", "text": reply})
    return {"reply": reply}



@app.get("/history")
async def get_history(session_id: str = 'default'):
    return {"session_id": session_id, "messages": ChatStore.get_history(session_id)}


@app.post("/history/clear")
async def clear_history(session_id: str = 'default'):
    ChatStore.clear(session_id)
    return {"ok": True}


if __name__ == "__main__":
    # Simple local runner: `python backend/main.py`
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "127.0.0.1")
    # When running `python main.py` from the backend folder, use the module name 'main'
    uvicorn.run("main:app", host=host, port=port, reload=True)
