const CSRF_HEADER = 'X-CSRF-Token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

let csrfToken: string | null = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  const response = await fetch('/api/csrf-token', { credentials: 'include' });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.csrfToken) {
    throw new Error(json.error || 'Failed to initialize secure request token');
  }
  csrfToken = json.csrfToken;
  return csrfToken;
}

export function resetCsrfToken() {
  csrfToken = null;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  if (!SAFE_METHODS.has(method)) {
    headers.set(CSRF_HEADER, await getCsrfToken());
  }

  const request = {
    ...options,
    method,
    credentials: 'include',
    headers,
  } satisfies RequestInit;

  const response = await fetch(path, request);
  if (response.status !== 403 || SAFE_METHODS.has(method)) return response;

  csrfToken = null;
  headers.set(CSRF_HEADER, await getCsrfToken());
  return fetch(path, request);
}
