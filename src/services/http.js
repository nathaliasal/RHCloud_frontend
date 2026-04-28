import axios from 'axios'
import { BASE_URL } from '@/constants/api'

const AUTH_KEY = 'rhcloud.web.auth'

export const http = axios.create({ baseURL: BASE_URL })

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_KEY)
  if (raw) {
    const { accessToken } = JSON.parse(raw)
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
      return config
    }
  }
  // fallback: token written during login before Zustand session is set
  const rawTokens = localStorage.getItem('rhcloud.tokens')
  if (rawTokens) {
    const { accessToken } = JSON.parse(rawTokens)
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url = error.config?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/me') || url.includes('/auth/recover') || url.includes('/auth/reset')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(AUTH_KEY)
      const { useAuthStore } = await import('@/stores/auth')
      useAuthStore.getState().clearUser()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
