// Replaced: all chat API calls now use a single backend endpoint which returns JSON { reply: string }
// IMPORTANT: this uses the public ngrok URL you provided. Change it if your tunnel changes.
export async function sendMessage(message) {
  const response = await fetch("https://cliquish-unsaluted-pablo.ngrok-free.dev/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

  const data = await response.json();
  return data.reply;
}

// Keep a minimal getHistory/getApiBase in case other parts expect them. They now return defaults.
export async function getHistory(){
  return { session_id: 'local', messages: [] };
}

export function getApiBase(){ return 'https://cliquish-unsaluted-pablo.ngrok-free.dev' }
