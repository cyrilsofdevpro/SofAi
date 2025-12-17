// Replaced: all chat API calls now use a single backend endpoint which returns JSON { reply: string }
// IMPORTANT: this uses the public ngrok URL. Change it if your tunnel changes.
export async function sendMessage(message) {
  // Use the public ngrok URL as the single backend endpoint.
  const url = 'https://cliquish-unsaluted-pablo.ngrok-free.dev/predict';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  if (!res.ok) {
    throw new Error(`Request to ${url} failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data || typeof data.reply !== 'string') throw new Error('Invalid response from backend');
  return data.reply;
}

// Keep a minimal getHistory/getApiBase in case other parts expect them. They now return defaults.
export async function getHistory(){
  return { session_id: 'local', messages: [] };
}

export function getApiBase(){ return 'https://cliquish-unsaluted-pablo.ngrok-free.dev' }
