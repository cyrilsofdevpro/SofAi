# SofAI — Local AI Assistant (MVP)

SofAI is a starter project to build an independent AI assistant using open-source models.

Quick start (backend):

1. Create a Python virtual environment and install backend requirements:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r backend/requirements.txt
```

2. Run backend locally:

```powershell
cd backend; python main.py
```

Quick start (frontend):

1. Install frontend deps and run dev server (requires Node.js):

```powershell
cd frontend; npm install; npm run dev
```

Notes:
- By default the backend tries to load `mistral-7b-instruct`. Set `MODEL_NAME` to change.
- To allow models that require remote code, set `MODEL_TRUST_REMOTE=1` in the environment.
- For faster inference on CUDA devices, set `MODEL_LOAD_8BIT=1` (requires bitsandbytes).

Project layout:
- `backend/` — FastAPI server, model loader, utils
- `frontend/` — React chat UI
- `data/` — datasets and KBs
- `scripts/` — preprocessing and training helpers
- `notebooks/` — experiments and quick tests

Next steps:
- Add auth and chat history storage
- Add RAG with FAISS or ChromaDB
- Implement LoRA fine-tuning pipeline
- Add deployment guides (Railway / Render / HuggingFace Spaces)

