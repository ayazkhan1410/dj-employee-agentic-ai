function getApiUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:8000`
}

const API_URL = getApiUrl()

function clearAuth() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('user')
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh')
  if (!refresh) return null

  const response = await fetch(`${API_URL}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access) {
    clearAuth()
    return null
  }

  localStorage.setItem('access', data.access)
  return data.access
}

function extractError(data) {
  if (!data) return 'Something went wrong'
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) return data.detail.join(' ')
  return (
    data.email?.[0] ||
    data.password?.[0] ||
    data.name?.[0] ||
    data.non_field_errors?.[0] ||
    'Something went wrong'
  )
}

async function request(path, options = {}, retry = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = localStorage.getItem('access')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && retry && !path.includes('/api/auth/login')) {
    const nextAccess = await refreshAccessToken()
    if (nextAccess) {
      return request(path, options, false)
    }
    clearAuth()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
    throw new Error('Session expired. Please sign in again.')
  }

  if (response.status === 204) return null

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(extractError(data))
  }
  return data
}

export function signup({ name, email, password }) {
  return request('/api/auth/signup/', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function login({ email, password }) {
  return request('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function me() {
  return request('/api/auth/me/')
}

export function getDashboard() {
  return request('/api/orders/dashboard/')
}

function toQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

export function listOrders(params = {}) {
  return request(`/api/orders/${toQuery(params)}`)
}

export function getOrder(id) {
  return request(`/api/orders/${id}/`)
}

export function createOrder(payload) {
  return request('/api/orders/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrder(id, payload) {
  return request(`/api/orders/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function patchOrder(id, payload) {
  return request(`/api/orders/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteOrder(id) {
  return request(`/api/orders/${id}/`, {
    method: 'DELETE',
  })
}
