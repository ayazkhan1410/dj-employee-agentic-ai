const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(path, options = {}) {
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

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      data.detail ||
      data.email?.[0] ||
      data.password?.[0] ||
      data.name?.[0] ||
      data.non_field_errors?.[0] ||
      'Something went wrong'
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
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
