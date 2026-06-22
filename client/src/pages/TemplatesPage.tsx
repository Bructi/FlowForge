import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, Code2, Download, Copy, ExternalLink, Filter, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { templatesApi, workflowsApi } from '../api'

const CATEGORIES = ['All', 'General', 'Email', 'Content', 'Documents', 'HR', 'Productivity', 'Sales', 'Support']

export default function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['templates', search, category],
    queryFn: () => templatesApi.list({ search: search || undefined, category: category !== 'All' ? category.toLowerCase() : undefined }),
  })

  const templates = data?.data?.data?.templates || []

  const useTemplateMutation = useMutation({
    mutationFn: (id: string) => templatesApi.use(id),
    onSuccess: (res) => {
      toast.success('Template cloned successfully!')
      navigate(`/workflows/${res.data.data.workflow.id}/builder`)
    },
    onError: () => toast.error('Failed to use template'),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => workflowsApi.create(d),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow created!')
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      navigate(`/workflows/${res.data.data.workflow.id}/builder`)
    },
    onError: () => toast.error('Failed to create workflow'),
  })

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">Ready-to-use workflows for common AI use cases.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Blank Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search templates..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat ? 'bg-violet-100 text-violet-700' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state py-20 card bg-white">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-title">No templates found</p>
          <p className="empty-state-desc">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {templates.map((tpl: any, i: number) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="card relative p-6 flex flex-col group overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl leading-none">{tpl.icon || '⚡'}</div>
                  {tpl.is_builtin === 1 && (
                    <span className="badge-violet text-[10px]">Official</span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-violet-600 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-3">
                  {tpl.description}
                </p>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <span className="badge-gray uppercase tracking-wider text-[10px] mr-auto">
                    {tpl.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                    <Download className="w-3.5 h-3.5" /> {tpl.downloads || 0}
                  </div>
                </div>

                {/* Hover overlay button */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[10px]">
                  <button
                    id={`use-template-${tpl.id}`}
                    onClick={() => useTemplateMutation.mutate(tpl.id)}
                    disabled={useTemplateMutation.isPending}
                    className="btn-primary shadow-lg"
                  >
                    <Copy className="w-4 h-4" />
                    Use Template
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-6 w-full max-w-md relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">New Workflow</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input id="new-workflow-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="e.g. Email Automation" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea id="new-workflow-desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="input h-20 resize-none" placeholder="What does this workflow do?" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                <button
                  id="create-workflow-submit"
                  className="btn-primary flex-1 justify-center"
                  disabled={!newName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate({ name: newName.trim(), description: newDesc.trim() })}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create & Open'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
