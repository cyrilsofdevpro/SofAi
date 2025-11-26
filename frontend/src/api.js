import axios from 'axios';

// Default to your ngrok URL if VITE_API_BASE isn't set in the environment.
const DEFAULT_BASE = 'https://cliquish-unsaluted-pablo.ngrok-free.dev';
const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_BASE;

function getSessionId() {
  let sid = localStorage.getItem('sofai_session_id');
  if (!sid) {
    sid = 'sess-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('sofai_session_id', sid);
  }
  return sid;
}

export async function sendMessage(message){
  const sessionId = getSessionId();
  const headers = { 'x-session-id': sessionId, 'x-api-key': import.meta.env.VITE_API_KEY || '' };
  const payload = { message, max_tokens: 256 };

  // Try common endpoint variants: /api/chat (Colab/Flask) then /chat (FastAPI)
  const candidates = [`${API_BASE}/api/chat`, `${API_BASE}/chat`];
  let lastErr = null;
  for(const url of candidates){
    try{
      const res = await axios.post(url, payload, { headers });
      return res.data;
    }catch(err){
      lastErr = err;
      // if 404 try next, otherwise break and throw
      if(err.response && err.response.status === 404){
        continue;
      }
      // network error or other -> continue to try next candidate
    }
  }
  // If we reach here, throw the last error for upstream handling
  throw lastErr;
}

export async function getHistory(){
  const sessionId = getSessionId();
  const candidates = [`${API_BASE}/history`, `${API_BASE}/history`];
  // same endpoint for both patterns, keep for symmetry or future changes
  for(const url of candidates){
    try{
      const res = await axios.get(url, { params: { session_id: sessionId } });
      return res.data;
    }catch(err){
      // try next
      continue;
    }
  }
  return { session_id: sessionId, messages: [] };
}

export function getApiBase(){ return API_BASE }
