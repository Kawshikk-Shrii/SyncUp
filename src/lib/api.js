import { supabase } from './supabaseClient'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

export async function apiFetch(path, options = {}) {
  const token = await getAccessToken()
  let response

  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new Error(`Cannot reach SyncUp API at ${API}. Start the backend server and check its .env file.`)
  }

  let payload = {}
  try {
    payload = await response.json()
  } catch {
    payload = {}
  }

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload
}

export { API }
