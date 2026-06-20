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

function filenameFromContentDisposition(header: string | null, fallback: string) {
  if (!header) return fallback;
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  return fallback;
}

export async function downloadApplicationFile(applicationId: string, kind: 'cv' | 'transcript', fallbackName: string) {
  return downloadProtectedFile(`/api/applications/${encodeURIComponent(applicationId)}/files/${kind}`, fallbackName);
}

export async function downloadProtectedFile(path: string, fallbackName: string) {
  const response = await apiFetch(path);
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error || 'Download failed');
  }

  const blob = await response.blob();
  const filename = filenameFromContentDisposition(response.headers.get('content-disposition'), fallbackName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
