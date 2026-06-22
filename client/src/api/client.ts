import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ─── Request interceptor — add access token ─────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor — auto refresh token ──────────────
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401) {
      if (error.response?.data?.error?.code === 'TOKEN_EXPIRED' && !original._retry) {
        original._retry = true

        if (isRefreshing) {
          return new Promise((resolve) => {
            refreshQueue.push((token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            })
          })
        }

        isRefreshing = true
        const refreshToken = useAuthStore.getState().refreshToken

        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken })
          const newToken = data.data.accessToken
          useAuthStore.getState().setAccessToken(newToken)
          refreshQueue.forEach((cb) => cb(newToken))
          refreshQueue = []
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch (refreshErr: any) {
          if (refreshErr.response?.status === 401 || refreshErr.response?.status === 400) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
          }
        } finally {
          isRefreshing = false
        }
      } else if (!original._retry) {
        // If it's a 401 but NOT token expired (e.g. user deleted, db reset)
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
