import axios from 'axios'

export const api = axios.create({
  baseURL: (import.meta.env.VITE_BACKEND_URL ?? '') + '/api/v1',
})

api.interceptors.request.use((config) => {
  const pin = localStorage.getItem('parentPin')
  if (pin) config.headers['X-Parent-Pin'] = pin
  return config
})
