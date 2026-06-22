import { useQuery } from '@tanstack/react-query'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  input: 'bg-blue-500',
  ai: 'bg-violet-500',
  logic: 'bg-amber-500',
  utility: 'bg-emerald-500',
  database: 'bg-red-500',
  api: 'bg-cyan-500',
  email: 'bg-pink-500',
  output: 'bg-slate-500',
}

const NODE_TYPES_STATIC = [
  {
    id: 'input', label: 'Inputs', color: '#2563EB', nodes: [
      { type: 'textInput', label: 'Text Input', icon: '📝' },
      { type: 'chatInput', label: 'Chat Input', icon: '💬' },
      { type: 'fileUpload', label: 'File Upload', icon: '📁' },
      { type: 'webhook', label: 'Webhook', icon: '🔗' },
      { type: 'apiInput', label: 'API Input', icon: '🌐' },
    ],
  },
  {
    id: 'ai', label: 'AI Models', color: '#7C3AED', nodes: [
      { type: 'aiNode', label: 'AI Model', icon: '🤖' },
    ],
  },
  {
    id: 'logic', label: 'Logic', color: '#D97706', nodes: [
      { type: 'ifElse', label: 'If / Else', icon: '🔀' },
      { type: 'switchNode', label: 'Switch', icon: '🔃' },
      { type: 'filter', label: 'Filter', icon: '🔽' },
      { type: 'loop', label: 'Loop', icon: '🔁' },
      { type: 'delay', label: 'Delay', icon: '⏱️' },
      { type: 'scheduler', label: 'Scheduler', icon: '📅' },
    ],
  },
  {
    id: 'utility', label: 'Utilities', color: '#059669', nodes: [
      { type: 'formatter', label: 'Formatter', icon: '✏️' },
      { type: 'jsonParser', label: 'JSON Parser', icon: '{ }' },
      { type: 'regex', label: 'Regex', icon: '🔤' },
      { type: 'textCleaner', label: 'Text Cleaner', icon: '🧹' },
      { type: 'calculator', label: 'Calculator', icon: '🧮' },
    ],
  },
  {
    id: 'database', label: 'Database', color: '#DC2626', nodes: [
      { type: 'sqliteQuery', label: 'SQLite Query', icon: '🗄️' },
      { type: 'sqliteInsert', label: 'SQLite Insert', icon: '➕' },
      { type: 'sqliteUpdate', label: 'SQLite Update', icon: '✏️' },
      { type: 'sqliteDelete', label: 'SQLite Delete', icon: '🗑️' },
    ],
  },
  {
    id: 'api', label: 'API', color: '#0891B2', nodes: [
      { type: 'restAPI', label: 'REST API', icon: '🌍' },
      { type: 'graphQL', label: 'GraphQL', icon: '⬡' },
    ],
  },
  {
    id: 'email', label: 'Email', color: '#BE185D', nodes: [
      { type: 'smtp', label: 'SMTP Email', icon: '📨' },
      { type: 'gmail', label: 'Gmail', icon: '📧' },
    ],
  },
  {
    id: 'output', label: 'Outputs', color: '#374151', nodes: [
      { type: 'textOutput', label: 'Text Output', icon: '📤' },
      { type: 'jsonOutput', label: 'JSON Output', icon: '{ }' },
      { type: 'fileOutput', label: 'File Output', icon: '💾' },
      { type: 'notification', label: 'Notification', icon: '🔔' },
    ],
  },
]

export default function NodePanel() {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const filtered = NODE_TYPES_STATIC.map((cat) => ({
    ...cat,
    nodes: cat.nodes.filter((n) =>
      !search || n.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => !search || cat.nodes.length > 0)

  const onDragStart = (e: React.DragEvent, type: string, label: string) => {
    e.dataTransfer.setData('application/reactflow-type', type)
    e.dataTransfer.setData('application/reactflow-label', label)
    e.dataTransfer.effectAllowed = 'move'
  }

  const toggleCategory = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Node Library</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 h-8 text-xs"
            placeholder="Search nodes..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((cat) => (
          <div key={cat.id}>
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold text-slate-500 hover:bg-slate-50 uppercase tracking-wider"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <span className="flex-1 text-left">{cat.label}</span>
              {collapsed[cat.id] ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {!collapsed[cat.id] && (
              <div className="mt-1 space-y-0.5">
                {cat.nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type, node.label)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-slate-700 cursor-grab active:cursor-grabbing hover:bg-violet-50 hover:text-violet-700 transition-colors select-none group"
                  >
                    <span className="text-base leading-none">{node.icon}</span>
                    <span className="font-medium">{node.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400">Drag nodes onto canvas →</p>
      </div>
    </aside>
  )
}
