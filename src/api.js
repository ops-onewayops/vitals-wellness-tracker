// Local Backend Proxy helper for iOS App Store Compliance
// The API key is securely held by the server.

const PROXY_URL = '/api/chat';
const MODEL = 'claude-sonnet-4-20250514';

export function getApiKey() {
  return 'proxy-auth-token-placeholder'; // In production, this would be an auth token (e.g. Sign in with Apple)
}

export function setApiKey(key) {
  // no-op
}

export function hasApiKey() {
  return true; // We assume the backend handles auth implicitly for now
}

export async function callClaude({ system, messages, maxTokens = 1000 }) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${getApiKey()}` // Placeholder for future auth
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Proxy error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.map(c => c.text || '').join('\n') || '';
}
