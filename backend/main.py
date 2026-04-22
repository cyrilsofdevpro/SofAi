from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel
import os
from fastapi.middleware.cors import CORSMiddleware
# Import lightweight helpers (these don't import heavy HF deps)
try:
    from .utils import verify_api_key
    from .storage import ChatStore
    from .database import db
    from .web_search import perform_search, needs_search, format_search_context, build_search_prompt
except Exception:
    from utils import verify_api_key
    from storage import ChatStore
    from database import db
    from web_search import perform_search, needs_search, format_search_context, build_search_prompt


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
from typing import List, Dict, Optional

class ChatRequest(BaseModel):
    message: str
    max_tokens: int = 2048  # increased for longer, complete ChatGPT-like responses
    model: str = "qwen"
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    reply: str
    sources: Optional[List[Dict[str, str]]] = None
    used_search: Optional[bool] = False


# Authentication Models
class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    username: str
    gender: str = "not-specified"


class AuthResponse(BaseModel):
    success: bool
    message: str = None
    error: str = None
    user: dict = None


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


# Initialize models dictionary
models = {}


@app.on_event("startup")
async def startup_event():
    global models
    # If SKIP_MODEL_LOAD is set, use the lightweight dummy model for quick local testing
    skip = os.getenv("SKIP_MODEL_LOAD", "0").lower() in ("1", "true", "yes")
    if skip:
        models["qwen"] = _DummyModel()
        models["TinyLlama/TinyLlama-1.1B-Chat-v1.0"] = _DummyModel()
        models["tinyllama"] = _DummyModel()
        return

    # Import the model loader lazily to avoid importing heavy HF libraries at module import time
    try:
        from .model_loader import ModelWrapper
    except Exception:
        from model_loader import ModelWrapper

    # Load models
    models["qwen"] = ModelWrapper.load_cached("Qwen/Qwen2.5-0.5B-Instruct", trust_remote_code=MODEL_TRUST_REMOTE, load_in_8bit=MODEL_LOAD_8BIT, revision=MODEL_REVISION)
    models["TinyLlama/TinyLlama-1.1B-Chat-v1.0"] = ModelWrapper.load_cached("TinyLlama/TinyLlama-1.1B-Chat-v1.0", trust_remote_code=MODEL_TRUST_REMOTE, load_in_8bit=MODEL_LOAD_8BIT, revision=MODEL_REVISION)
    models["tinyllama"] = models["TinyLlama/TinyLlama-1.1B-Chat-v1.0"]  # alias


@app.get("/health")
async def health():
    return {"status": "ok"}


# ============= Authentication Endpoints =============

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    """Create a new user account"""
    result = db.create_user(
        email=req.email,
        password=req.password,
        username=req.username,
        gender=req.gender
    )
    
    if result["success"]:
        return AuthResponse(
            success=True,
            message=result["message"],
            user=result["user"]
        )
    else:
        raise HTTPException(status_code=400, detail=result["error"])


@app.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate user and return user data"""
    result = db.authenticate_user(email=req.email, password=req.password)
    
    if result["success"]:
        return AuthResponse(
            success=True,
            message=result["message"],
            user=result["user"]
        )
    else:
        raise HTTPException(status_code=401, detail=result["error"])


@app.post("/auth/check-email")
async def check_email(email: str):
    """Check if email is already registered"""
    exists = db.user_exists(email)
    return {
        "email": email,
        "exists": exists,
        "message": "User found" if exists else "Email available for registration"
    }


# ============= Chat Endpoints =============
@app.post("/chat")
async def chat(req: ChatRequest):
    """
    Web search enabled chat endpoint.
    
    Flow:
    1. Search web for relevant information
    2. Build context from search results
    3. Build prompt with context
    4. Generate response using model
    5. Return response with sources
    """
    # 1. Search web
    search_results = perform_search(req.message, num_results=5)

    # 2. Build context from search results
    context = format_search_context(search_results)

    # 3. Build prompt with context
    system_prompt = """You are a helpful AI assistant with real-time web access. Provide detailed, accurate, and comprehensive responses using the web information provided. Structure your answers with clear sections, bullet points, numbered lists, and explanations when appropriate. Always cite sources when using web information."""
    
    prompt = f"""System: {system_prompt}

Web Context:
{context}

User Question: {req.message}

Answer:"""

    # 4. Run model and generate response
    selected_model = models.get(req.model, models.get("qwen"))
    if selected_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    answer = selected_model.generate_response(
        prompt,
        max_new_tokens=250,
        temperature=0.7,
        top_p=0.95,
        do_sample=True
    )

    # 5. Return response with sources
    return {
        "response": answer,
        "sources": search_results
    }


@app.post("/predict")
async def predict(req: ChatRequest, request: Request):
    """Lightweight prediction endpoint for simple frontends and ngrok tunnels.
    This endpoint intentionally does not require API key authentication (meant for local testing).
    It returns JSON {"reply": str, "model_used": str} so simple clients can consume it.
    """
    selected_model = models.get(req.model, models.get("qwen"))
    if req.model == "auto":
        selected_model = models.get("qwen")  # for now, auto uses qwen
    if selected_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    session_id = request.headers.get('x-session-id', 'default')
    ChatStore.add_message(session_id, {"role": "user", "text": req.message})

    # reuse the same canned-response logic used by /chat
    # If the user asks about the assistant's identity, return the canned SofAi reply
    if _is_identity_question(req.message):
        canned = 'I am SofAi, created by the Sofdev Team'
        ChatStore.add_message(session_id, {"role": "bot", "text": canned})
        return {"reply": canned, "model_used": "canned", "sources": None, "used_search": False}

    # Check if web search is needed
    search_results = []
    used_search = False
    
    if needs_search(req.message):
        try:
            search_results = perform_search(req.message, num_results=5)
            used_search = len(search_results) > 0
        except Exception as e:
            print(f"Search error: {e}")
            search_results = []

    # Format prompt based on the selected model
    system_prompt = """You are a helpful AI assistant like ChatGPT. Provide detailed, accurate, and comprehensive responses. Structure your answers with clear sections, bullet points, numbered lists, and explanations when appropriate. Use engaging language, and offer follow-up suggestions or additional help when relevant."""
    
    # Build conversation history
    conversation = []
    if req.history:
        for msg in req.history:
            conversation.append(f"{msg['role'].capitalize()}: {msg['content']}")
    
    # Add search context if available
    if used_search and search_results:
        search_context = format_search_context(search_results)
        system_prompt += f"\n\nWeb Search Results:\n{search_context}"
    
    conversation.append(f"User: {req.message}")
    
    if req.model == "qwen":
        formatted_prompt = f"System: {system_prompt}\n" + "\n".join(conversation) + "\nAssistant:"
    elif req.model == "TinyLlama/TinyLlama-1.1B-Chat-v1.0":
        formatted_prompt = f"<|system|>\n{system_prompt}\n" + "\n".join([f"<|{msg.split(': ')[0].lower()}|>\n{msg.split(': ', 1)[1]}" for msg in conversation]) + "\n<|assistant|>\n"
    else:
        formatted_prompt = f"System: {system_prompt}\n" + "\n".join(conversation) + "\nAssistant:"  # fallback

    final_model = req.model
    reply = selected_model.generate_response(
        formatted_prompt,
        max_new_tokens=req.max_tokens,
        temperature=0.7,
        top_p=0.95,
        do_sample=True,
    )

    # Auto-switch model if response is too short for better quality
    if len(reply.strip()) < 200 and req.model in models:
        other_model_key = "TinyLlama/TinyLlama-1.1B-Chat-v1.0" if req.model == "qwen" else "qwen"
        if other_model_key in models:
            final_model = other_model_key
            other_model = models[other_model_key]
            # Reformat prompt for other model
            if other_model_key == "qwen":
                formatted_prompt = f"System: {system_prompt}\n" + "\n".join(conversation) + "\nAssistant:"
            else:
                formatted_prompt = f"<|system|>\n{system_prompt}\n" + "\n".join([f"<|{msg.split(': ')[0].lower()}|>\n{msg.split(': ', 1)[1]}" for msg in conversation]) + "\n<|assistant|>\n"
            reply = other_model.generate_response(
                formatted_prompt,
                max_new_tokens=req.max_tokens,
                temperature=0.7,
                top_p=0.95,
                do_sample=True,
            )

    ChatStore.add_message(session_id, {"role": "bot", "text": reply})
    return {
        "reply": reply, 
        "model_used": final_model, 
        "sources": search_results if used_search else None,
        "used_search": used_search
    }



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
