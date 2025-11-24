export const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`
  return fetch(url, init)
}

