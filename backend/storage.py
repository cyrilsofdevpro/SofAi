"""In-memory chat storage for simple session-based histories.

This is a lightweight implementation for local testing. Replace with a
persistent store (Redis, Supabase, Postgres) for production use.
"""

from typing import List, Dict, Any


class ChatStore:
    _store: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def add_message(cls, session_id: str, message: Dict[str, Any]):
        cls._store.setdefault(session_id, []).append(message)

    @classmethod
    def get_history(cls, session_id: str):
        return cls._store.get(session_id, [])

    @classmethod
    def clear(cls, session_id: str):
        cls._store.pop(session_id, None)

    @classmethod
    def list_sessions(cls):
        return list(cls._store.keys())
