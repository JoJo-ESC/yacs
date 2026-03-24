const apiBaseUrl = process.env.REACT_APP_API_BASE_URL ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchText(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  return response.text();
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}
