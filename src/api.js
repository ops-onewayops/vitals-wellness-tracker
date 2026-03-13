// Anthropic API helper
// Your API key is stored in localStorage (never sent anywhere except Anthropic).
// In a production app you'd proxy this through a backend, but for a personal
// single-user app this is fine.

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export function getApiKey() {
  return localStorage.getItem('vitals-anthropic-key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('vitals-anthropic-key', key);
}

export function hasApiKey() {
  return !!getApiKey();
}

export async function callClaude({ system, messages, maxTokens = 1000 }) {
  const key = getApiKey();
  if (!key) throw new Error('No API key set. Go to Settings to add your Anthropic API key.');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
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
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.map(c => c.text || '').join('\n') || '';
}
