// Single place where the client talks to the API: base URL, JSON, token and errors.

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

let getToken = () => null
let onUnauthorized = () => {}

/** Called once by the session store, so http.js does not depend on it. */
export function configureHttp(options) {
  getToken = options.getToken
  onUnauthorized = options.onUnauthorized
}

/** Error of an API call: HTTP status, message and per-field errors (422). */
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ?? `Erreur ${status}`)
    this.status = status
    this.errors = body?.errors ?? {}
  }
}

/**
 * Sends a request to the API and returns { data, headers }.
 * `query` values that are undefined, null or '' are left out.
 */
export async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(API_URL + path)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  const options = { method, headers: {} }
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  const token = getToken()
  if (token) {
    options.headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(url, options)
  } catch {
    throw new ApiError(0, { message: "Impossible de joindre l'API" })
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    // A token that expired or whose account was deleted: back to the login page
    if (response.status === 401 && token) {
      onUnauthorized()
    }
    throw new ApiError(response.status, data)
  }
  return { data, headers: response.headers }
}

/** Reads the Pagination-* headers of a list response. */
export function readPagination(headers) {
  return {
    page: Number(headers.get('Pagination-Page')),
    pageSize: Number(headers.get('Pagination-Page-Size')),
    total: Number(headers.get('Pagination-Total')),
  }
}
