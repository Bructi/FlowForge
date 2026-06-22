import api from './client'

export const workflowsApi = {
  list: (params?: any) => api.get('/workflows', { params }),
  get: (id: string) => api.get(`/workflows/${id}`),
  create: (data: any) => api.post('/workflows', data),
  update: (id: string, data: any) => api.put(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  clone: (id: string) => api.post(`/workflows/${id}/clone`),
  export: (id: string) => api.post(`/workflows/${id}/export`),
  import: (data: any) => api.post('/workflows/import', data),
  versions: (id: string) => api.get(`/workflows/${id}/versions`),
}

export const executionsApi = {
  run: (workflowId: string, inputData?: any) => api.post('/executions/run', { workflowId, inputData }),
  list: (params?: any) => api.get('/executions', { params }),
  get: (id: string) => api.get(`/executions/${id}`),
  stop: (id: string) => api.post(`/executions/${id}/stop`),
  delete: (id: string) => api.delete(`/executions/${id}`),
}

export const templatesApi = {
  list: (params?: any) => api.get('/templates', { params }),
  get: (id: string) => api.get(`/templates/${id}`),
  use: (id: string) => api.post(`/templates/${id}/use`),
  create: (data: any) => api.post('/templates', data),
}

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  workflow: (id: string) => api.get(`/analytics/workflows/${id}`),
}

export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
}

export const integrationsApi = {
  list: () => api.get('/integrations'),
  addApiKey: (data: any) => api.post('/integrations/api-keys', data),
  deleteApiKey: (id: string) => api.delete(`/integrations/api-keys/${id}`),
}

export const aiApi = {
  providers: () => api.get('/ai/providers'),
  ollamaModels: () => api.get('/ai/models/ollama'),
  openrouterModels: () => api.get('/ai/models/openrouter'),
  test: (provider: string, model?: string) => api.post('/ai/test', { provider, model }),
}

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  signup: (name: string, email: string, password: string) => api.post('/auth/signup', { name, email, password }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) => api.put('/auth/change-password', { currentPassword, newPassword }),
}

export const filesApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  list: () => api.get('/files'),
  delete: (filename: string) => api.delete(`/files/${filename}`),
}
