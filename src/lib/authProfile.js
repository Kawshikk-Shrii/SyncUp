import { apiFetch } from './api'

export async function syncCurrentUserProfile() {
  return apiFetch('/auth/sync', { method: 'POST' })
}
