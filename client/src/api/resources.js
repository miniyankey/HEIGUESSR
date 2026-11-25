// One function per API route used by the client (see api/openapi.yaml).
import { readPagination, request } from './http.js'

async function data(promise) {
  return (await promise).data
}

// Authentication and users

export const login = (credentials) =>
  data(request('/auth/login', { method: 'POST', body: credentials }))

export const register = (account) =>
  data(request('/auth/register', { method: 'POST', body: account }))

export const getMe = () => data(request('/users/me'))

// Floors

// Same list as the API (api/models/floor.js)
export const BUILDINGS = ['Cheseaux', 'St-Roch']

export const listFloors = (filters = {}) => data(request('/floors', { query: filters }))

export const createFloor = (floor) => data(request('/floors', { method: 'POST', body: floor }))

export const updateFloor = (id, changes) =>
  data(request(`/floors/${id}`, { method: 'PATCH', body: changes }))

export const deleteFloor = (id) => data(request(`/floors/${id}`, { method: 'DELETE' }))

// Spots (admins only)

/** Returns { spots, pagination } for one page. */
export async function listSpots(query = {}) {
  const { data: spots, headers } = await request('/spots', { query })
  return { spots, pagination: readPagination(headers) }
}

export const createSpot = (spot) => data(request('/spots', { method: 'POST', body: spot }))

export const updateSpot = (id, changes) =>
  data(request(`/spots/${id}`, { method: 'PATCH', body: changes }))

export const deleteSpot = (id) => data(request(`/spots/${id}`, { method: 'DELETE' }))

// Images (admins only)

export const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp'

/**
 * Uploads an image directly to Cloudinary, then registers it in the API.
 * Returns the Upload document: its _id is used as a floor plan or spot image.
 */
export async function uploadImage(file) {
  const { uploadUrl, apiKey, signature, params } = await data(
    request('/uploads/signature', { method: 'POST' }),
  )

  // Every signed parameter must be sent unchanged, or Cloudinary refuses
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', apiKey)
  form.append('signature', signature)
  for (const [key, value] of Object.entries(params)) {
    form.append(key, value)
  }

  const response = await fetch(uploadUrl, { method: 'POST', body: form })
  const uploaded = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(uploaded.error?.message ?? "L'envoi vers Cloudinary a échoué")
  }

  return data(request('/uploads', { method: 'POST', body: { publicId: uploaded.public_id } }))
}
