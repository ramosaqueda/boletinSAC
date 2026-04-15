const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('ecoh-auth')
    return raw ? JSON.parse(raw)?.state?.token ?? null : null
  } catch {
    return null
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (res.status === 401 || res.status === 403) {
    if (res.status === 401) localStorage.removeItem('ecoh-auth')
    window.location.href = '/login'
    throw new Error(res.status === 401 ? 'Sesión expirada' : 'Acceso restringido — inicie sesión')
  }

  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? 'Error del servidor')
  return json as T
}

/** Upload multipart — no establece Content-Type para que el browser maneje el boundary */
async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (res.status === 401 || res.status === 403) {
    if (res.status === 401) localStorage.removeItem('ecoh-auth')
    window.location.href = '/login'
    throw new Error(res.status === 401 ? 'Sesión expirada' : 'Acceso restringido — inicie sesión')
  }
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error ?? 'Error del servidor')
  return json as T
}

export const api = {
  get:    <T>(path: string)                        => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown)         => apiFetch<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)         => apiFetch<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                        => apiFetch<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData)    => apiUpload<T>(path, formData),
}
