// One function per API route used by the client (see api/openapi.yaml).
import { request } from './http.js'

async function data(promise) {
  return (await promise).data
}

// Authentication and users

export const login = (credentials) =>
  data(request('/auth/login', { method: 'POST', body: credentials }))

export const register = (account) =>
  data(request('/auth/register', { method: 'POST', body: account }))

export const getMe = () => data(request('/users/me'))
