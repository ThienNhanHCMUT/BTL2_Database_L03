export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/+$/, '');
export const API_PREFIX = String(import.meta.env.VITE_API_PREFIX ?? '/api')
  .trim()
  .replace(/\/+$/, '');

export const ACCESS_TOKEN_KEY = 'movieticket_access_token';
export const REFRESH_TOKEN_KEY = 'movieticket_refresh_token';
export const USER_KEY = 'movieticket_user';

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiContractPath(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_PREFIX ? `${API_PREFIX}${normalizedPath}` : normalizedPath;
}

export async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function requestJson(path, options = {}) {
  const res = await fetch(apiUrl(path), options);
  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const error = new Error(data.message || 'Có lỗi xảy ra khi gọi API');
    error.status = res.status;
    error.code = data.code;
    error.fieldErrors = data.fieldErrors;
    error.data = data;
    throw error;
  }

  return data;
}
