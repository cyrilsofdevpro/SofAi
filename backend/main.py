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

models: dict = {}


class ChatRequest(BaseModel):
    message: str
    max_tokens: int = 512  # increased further for comprehensive ChatGPT-like responses
    model: str = "qwen"  # default to qwen, can be "qwen" or "TinyLlama/TinyLlama-1.1B-Chat-v1.0"


class ChatResponse(BaseModel):
    reply: str


def _is_identity_question(text: str) -> bool:
    """Return True if the user is asking who/what the assistant is (any phrasing about SofAi/identity).
    This centralizes identity detection so we always return the canned SofAi reply for those queries.
    """
    if not text:
        return False
    normalized = ''.join(ch for ch in text.lower() if ch.isalnum() or ch.isspace()).strip()
    if not normalized:
        return False

    # exact phrase matches
    patterns = [
        'who are you', 'what is your name', 'whoami',
        'who is sofai', 'what is sofai', 'who created you', 'who made you',
        'who made sofai', 'who invented you', 'what are you', 'what is your purpose'
    ]
    for p in patterns:
        if p in normalized:
            return True

    # generic fallback: presence of 'sofai' together with a question word
    if 'sofai' in normalized and any(q in normalized for q in ('who', 'what', 'creator', 'made')):
        return True

    return False


@app.on_event("startup")
async def startup_event():
    global models
    # If SKIP_MODEL_LOAD is set, use the lightweight dummy model for quick local testing
    skip = os.getenv("SKIP_MODEL_LOAD", "0").lower() in ("1", "true", "yes")
    if skip:
        models["qwen"] = _DummyModel()
        models["TinyLlama/TinyLlama-1.1B-Chat-v1.0"] = _DummyModel()
        return

    # Import the model loader lazily to avoid importing heavy HF libraries at module import time
    try:
        from .model_loader import ModelWrapper
    except Exception:
        from model_loader import ModelWrapper

    # Load both models
    models["qwen"] = ModelWrapper.load_cached("Qwen/Qwen2.5-0.5B-Instruct", trust_remote_code=MODEL_TRUST_REMOTE, load_in_8bit=MODEL_LOAD_8BIT, revision=MODEL_REVISION)
    models["TinyLlama/TinyLlama-1.1B-Chat-v1.0"] = ModelWrapper.load_cached("TinyLlama/TinyLlama-1.1B-Chat-v1.0", trust_remote_code=MODEL_TRUST_REMOTE, load_in_8bit=MODEL_LOAD_8BIT, revision=MODEL_REVISION)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request, api_key: str = Depends(verify_api_key)):
    selected_model = models.get(req.model, models.get("qwen"))
    if selected_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    # store user message in session history (optional)
    session_id = request.headers.get('x-session-id', 'default')
    ChatStore.add_message(session_id, {"role": "user", "text": req.message})

    # Shortcut canned responses for simple, common questions to avoid unnecessary model calls
    # If the user asks about the assistant's identity, return the canned SofAi reply
    if _is_identity_question(req.message):
        canned = 'I am SofAi, created by the Sofdev Team'
        ChatStore.add_message(session_id, {"role": "bot", "text": canned})
        return ChatResponse(reply=canned)

    # Format prompt based on the selected model
    system_prompt = "You are a helpful AI assistant like ChatGPT. Provide detailed, accurate, and comprehensive responses."
    if req.model == "qwen":
        formatted_prompt = f"System: {system_prompt}\nUser: {req.message}\nAssistant:"
    elif req.model == "TinyLlama/TinyLlama-1.1B-Chat-v1.0":
        formatted_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{req.message}\n<|assistant|>\n"
    else:
        formatted_prompt = f"System: {system_prompt}\nUser: {req.message}\nAssistant:"  # fallback

    # Generate response with parameters optimized for ChatGPT-like quality
    reply = selected_model.generate_response(
        formatted_prompt,
        max_new_tokens=req.max_tokens,
        temperature=0.7,  # increased for more natural, varied responses
        top_p=0.95,       # higher for better diversity
        do_sample=True,   # enable sampling for creativity
    )

    ChatStore.add_message(session_id, {"role": "bot", "text": reply})
    return ChatResponse(reply=reply)


@app.post("/predict")
async def predict(req: ChatRequest, request: Request):
    """Lightweight prediction endpoint for simple frontends and ngrok tunnels.
    This endpoint intentionally does not require API key authentication (meant for local testing).
    It returns JSON {"reply": str} so simple clients can consume it.
    """
    selected_model = models.get(req.model, models.get("qwen"))
    if selected_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    session_id = request.headers.get('x-session-id', 'default')
    ChatStore.add_message(session_id, {"role": "user", "text": req.message})

    # reuse the same canned-response logic used by /chat
    # If the user asks about the assistant's identity, return the canned SofAi reply
    if _is_identity_question(req.message):
        canned = 'I am SofAi, created by the Sofdev Team'
        ChatStore.add_message(session_id, {"role": "bot", "text": canned})
        return {"reply": canned}

    # Format prompt based on the selected model
    system_prompt = "You are a helpful AI assistant like ChatGPT. Provide detailed, accurate, and comprehensive responses."
    if req.model == "qwen":
        formatted_prompt = f"System: {system_prompt}\nUser: {req.message}\nAssistant:"
    elif req.model == "TinyLlama/TinyLlama-1.1B-Chat-v1.0":
        formatted_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{req.message}\n<|assistant|>\n"
    else:
        formatted_prompt = f"System: {system_prompt}\nUser: {req.message}\nAssistant:"  # fallback
    reply = selected_model.generate_response(
        formatted_prompt,
        max_new_tokens=req.max_tokens,
        temperature=0.7,
        top_p=0.95,
        do_sample=True,
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
