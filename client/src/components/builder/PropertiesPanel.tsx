import { Node } from 'reactflow'
import { X, Trash2, Settings2 } from 'lucide-react'
import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { aiApi } from '../../api'

interface Props {
  nodeId: string
  nodes: Node[]
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
}

const AI_PROVIDERS = [
  { value: 'ollama', label: '🦙 Ollama (Local)' },
  { value: 'openai', label: '🤖 OpenAI' },
  { value: 'gemini', label: '✨ Gemini' },
  { value: 'claude', label: '🧠 Claude' },
  { value: 'deepseek', label: '🔍 DeepSeek' },
  { value: 'groq', label: '⚡ Groq' },
  { value: 'openrouter', label: '🌐 OpenRouter (Free)' },
]

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

export default function PropertiesPanel({ nodeId, nodes, onUpdate, onDelete }: Props) {
  const node = nodes.find((n) => n.id === nodeId)
  
  const { data: openRouterModelsData, isLoading: isLoadingOR } = useQuery({
    queryKey: ['openrouterModels'],
    queryFn: () => aiApi.openrouterModels(),
    enabled: node?.data?.provider === 'openrouter',
    staleTime: 5 * 60 * 1000, // 5 min
  })
  
  const openRouterModels = openRouterModelsData?.data?.data?.models || []

  if (!node) return null

  const data = node.data || {}
  const update = (key: string, val: any) => onUpdate(nodeId, { [key]: val })

  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
        <Settings2 className="w-4 h-4 text-violet-600" />
        <span className="text-sm font-semibold text-slate-900 flex-1 truncate">
          {data.label || node.type}
        </span>
        <button
          id={`delete-node-btn-${nodeId}`}
          onClick={() => { if (confirm('Delete this node?')) onDelete(nodeId) }}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common: Label */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Node Label</label>
          <input
            id={`node-label-${nodeId}`}
            className="input text-sm"
            value={data.label || ''}
            onChange={(e) => update('label', e.target.value)}
            placeholder="Node label"
          />
        </div>

        {/* AI Node Properties */}
        {node.type === 'aiNode' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Provider</label>
              <select
                id={`node-provider-${nodeId}`}
                className="input text-sm"
                value={data.provider || 'openrouter'}
                onChange={(e) => update('provider', e.target.value)}
              >
                {AI_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Model</label>
              {data.provider === 'openrouter' ? (
                isLoadingOR ? (
                  <div className="input text-sm text-slate-400">Loading free models...</div>
                ) : (
                  <select
                    id={`node-model-${nodeId}`}
                    className="input text-sm"
                    value={data.model || ''}
                    onChange={(e) => update('model', e.target.value)}
                  >
                    <option value="">Select a free model...</option>
                    {openRouterModels.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )
              ) : (
                <input
                  id={`node-model-${nodeId}`}
                  className="input text-sm"
                  value={data.model || ''}
                  onChange={(e) => update('model', e.target.value)}
                  placeholder={data.provider === 'openrouter' ? 'meta-llama/llama-3-8b-instruct:free' : 'gpt-4o-mini'}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">System Prompt</label>
              <textarea
                id={`node-system-prompt-${nodeId}`}
                className="input text-sm h-28 resize-none font-mono text-xs"
                value={data.systemPrompt || ''}
                onChange={(e) => update('systemPrompt', e.target.value)}
                placeholder="You are a helpful assistant..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Temperature: <span className="text-violet-600">{data.temperature ?? 0.7}</span>
              </label>
              <input
                type="range" min="0" max="2" step="0.1"
                value={data.temperature ?? 0.7}
                onChange={(e) => update('temperature', parseFloat(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Tokens</label>
              <input
                type="number" min="50" max="8000" step="50"
                className="input text-sm"
                value={data.maxTokens ?? 2000}
                onChange={(e) => update('maxTokens', parseInt(e.target.value))}
              />
            </div>
          </>
        )}

        {/* Text Input Properties */}
        {(node.type === 'textInput' || node.type === 'chatInput') && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Default Value</label>
              <textarea
                id={`node-value-${nodeId}`}
                className="input text-sm h-24 resize-none"
                value={data.value || ''}
                onChange={(e) => update('value', e.target.value)}
                placeholder="Enter default text..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Placeholder</label>
              <input
                className="input text-sm"
                value={data.placeholder || ''}
                onChange={(e) => update('placeholder', e.target.value)}
              />
            </div>
          </>
        )}

        {/* File Upload Properties */}
        {node.type === 'fileUpload' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Upload File</label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-600 hover:file:bg-violet-100"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      update('filename', file.name)
                      update('content', event.target?.result)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
              {data.filename && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="font-semibold text-slate-700">Attached:</span> {data.filename}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REST API Properties */}
        {(node.type === 'restAPI' || node.type === 'graphQL') && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">URL</label>
              <input className="input text-sm" value={data.url || ''} onChange={(e) => update('url', e.target.value)} placeholder="https://api.example.com/endpoint" />
            </div>
            {node.type === 'restAPI' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Method</label>
                <select className="input text-sm" value={data.method || 'GET'} onChange={(e) => update('method', e.target.value)}>
                  {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Headers (JSON)</label>
              <textarea className="input text-sm h-20 resize-none font-mono text-xs" value={typeof data.headers === 'object' ? JSON.stringify(data.headers, null, 2) : data.headers || ''} onChange={(e) => { try { update('headers', JSON.parse(e.target.value)) } catch { update('headers', e.target.value) } }} placeholder='{"Authorization": "Bearer ..."}' />
            </div>
          </>
        )}

        {/* If/Else */}
        {node.type === 'ifElse' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Condition</label>
            <input className="input text-sm font-mono" value={data.condition || ''} onChange={(e) => update('condition', e.target.value)} placeholder="value > 5" />
            <p className="text-xs text-slate-400 mt-1">Use JS expression. Variable: <code className="bg-slate-100 px-1 rounded">value</code></p>
          </div>
        )}

        {/* Delay */}
        {node.type === 'delay' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Delay (seconds)</label>
            <input type="number" min="0" max="3600" className="input text-sm" value={data.delaySeconds ?? 1} onChange={(e) => update('delaySeconds', parseFloat(e.target.value))} />
          </div>
        )}

        {/* Formatter */}
        {node.type === 'formatter' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Template</label>
            <textarea className="input text-sm h-24 resize-none font-mono text-xs" value={data.template || '{input}'} onChange={(e) => update('template', e.target.value)} placeholder="Hello, {name}! Your result is: {input}" />
            <p className="text-xs text-slate-400 mt-1">Use <code className="bg-slate-100 px-1 rounded">{'{input}'}</code> for the input value.</p>
          </div>
        )}

        {/* SQLite */}
        {node.type?.startsWith('sqlite') && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SQL Query</label>
            <textarea className="input text-sm h-28 resize-none font-mono text-xs" value={data.query || ''} onChange={(e) => update('query', e.target.value)} placeholder="SELECT * FROM workflows WHERE id = ?" />
          </div>
        )}

        {/* SMTP */}
        {(node.type === 'smtp' || node.type === 'gmail') && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
              <input className="input text-sm" value={data.to || ''} onChange={(e) => update('to', e.target.value)} placeholder="recipient@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
              <input className="input text-sm" value={data.subject || ''} onChange={(e) => update('subject', e.target.value)} placeholder="Email subject" />
            </div>
          </>
        )}

        {/* Node ID */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-300 font-mono">ID: {nodeId}</p>
          <p className="text-xs text-slate-300 font-mono">Type: {node.type}</p>
        </div>
      </div>
    </aside>
  )
}
