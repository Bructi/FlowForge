import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Key, Save, Server, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi, integrationsApi, aiApi } from '../api'
import { useAuthStore } from '../store/authStore'

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile Form
  const [name, setName] = useState(user?.name || '')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')

  // API Keys
  const [provider, setProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateProfile({ name }),
    onSuccess: (res) => { updateUser(res.data.data.user); toast.success('Profile updated') },
    onError: () => toast.error('Failed to update profile'),
  })

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword(currentPass, newPass),
    onSuccess: () => { toast.success('Password changed'); setCurrentPass(''); setNewPass('') },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Password change failed'),
  })

  const { data: keysData } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => integrationsApi.list(),
  })
  const keys = keysData?.data?.data?.apiKeys || []

  const saveKeyMutation = useMutation({
    mutationFn: () => integrationsApi.addApiKey({ provider, apiKey }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['api-keys'] }); toast.success('API Key saved'); setApiKey('') },
    onError: () => toast.error('Failed to save API key'),
  })

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.deleteApiKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const testKeyMutation = useMutation({
    mutationFn: (provider: string) => aiApi.test(provider),
    onSuccess: () => toast.success('Connection successful!'),
    onError: () => toast.error('Connection failed. Check your API key.'),
  })

  return (
    <div className="max-w-5xl mx-auto animate-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile, API keys, and system preferences.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <User className="w-5 h-5" /> Account Profile
          </button>
          <button onClick={() => setActiveTab('apikeys')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'apikeys' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Key className="w-5 h-5" /> API Keys (AI & Integrations)
          </button>
          <button onClick={() => setActiveTab('system')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Server className="w-5 h-5" /> System & Environment
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Profile Information</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <input disabled value={user?.email || ''} className="input bg-slate-50 text-slate-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
                  </div>
                  <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending || name === user?.name} className="btn-primary">
                    {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">Change Password</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                    <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                    <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="input" />
                  </div>
                  <button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || !currentPass || !newPass} className="btn-secondary">
                    {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apikeys' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">Add Provider Key</h2>
                <p className="text-sm text-slate-500 mb-4 border-b border-slate-100 pb-4">Keys are encrypted at rest using AES-256.</p>
                
                <div className="flex items-end gap-3 max-w-xl">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Provider</label>
                    <select value={provider} onChange={(e) => setProvider(e.target.value)} className="input">
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="claude">Anthropic Claude</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="groq">Groq</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="smtp">SMTP Relay</option>
                      <option value="twilio">Twilio</option>
                    </select>
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">API Key</label>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="input" placeholder="sk-..." />
                  </div>
                  <button onClick={() => saveKeyMutation.mutate()} disabled={!apiKey || saveKeyMutation.isPending} className="btn-primary py-2.5">
                    Save
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">Stored Keys</h2>
                </div>
                {keys.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No API keys saved yet.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr><th>Provider</th><th>Added On</th><th>Status</th><th className="text-right">Actions</th></tr>
                    </thead>
                    <tbody>
                      {keys.map((k: any) => (
                        <tr key={k.id}>
                          <td className="font-medium capitalize text-slate-900">{k.provider}</td>
                          <td className="text-slate-500">{new Date(k.created_at).toLocaleDateString()}</td>
                          <td><span className="badge-green">Active</span></td>
                          <td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => testKeyMutation.mutate(k.provider)} disabled={testKeyMutation.isPending} className="btn-secondary btn-sm text-xs">Test</button>
                              <button onClick={() => deleteKeyMutation.mutate(k.id)} className="btn-ghost btn-sm text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">System Environment</h2>
              <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm text-slate-300 space-y-2">
                <div className="flex justify-between"><span>Node Environment:</span><span className="text-emerald-400">Production</span></div>
                <div className="flex justify-between"><span>Database:</span><span className="text-violet-400">SQLite (Local)</span></div>
                <div className="flex justify-between"><span>Ollama Status:</span><span className="text-amber-400">Unreachable (Check config)</span></div>
                <div className="flex justify-between"><span>Version:</span><span className="text-blue-400">v1.0.0</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
