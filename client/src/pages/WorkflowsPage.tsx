import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Workflow, Play, Trash2, Copy, ExternalLink, MoreHorizontal, Filter, Download, Upload } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { workflowsApi, executionsApi } from '../api'

const STATUS_COLORS: Record<string, string> = {
  draft: 'badge-gray',
  active: 'badge-green',
  inactive: 'badge-yellow',
}

export default function WorkflowsPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', search],
    queryFn: () => workflowsApi.list({ search: search || undefined }),
  })
  const workflows = data?.data?.data?.workflows || []

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

  const importMutation = useMutation({
    mutationFn: (d: any) => workflowsApi.import(d),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow imported!')
      setShowImport(false)
      setImportJson('')
      navigate(`/workflows/${res.data.data.workflow.id}/builder`)
    },
    onError: () => toast.error('Failed to import workflow. Invalid JSON.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const cloneMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.clone(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Cloned!') },
    onError: () => toast.error('Failed to clone'),
  })

  const runMutation = useMutation({
    mutationFn: (id: string) => executionsApi.run(id),
    onSuccess: () => toast.success('Workflow started!'),
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed to run'),
  })

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson)
      // Accept either a full export object or just the workflow object
      const workflowData = parsed.workflow ? parsed : { workflow: parsed }
      importMutation.mutate(workflowData)
    } catch (e) {
      toast.error('Invalid JSON format')
    }
  }

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workflows</h1>
          <p className="page-subtitle">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <button id="import-workflow-btn" onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload className="w-4 h-4" /> Import JSON
          </button>
          <button id="create-workflow-btn" onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Workflow
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="workflow-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search workflows..."
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="empty-state py-20">
          <div className="empty-state-icon">⚡</div>
          <p className="empty-state-title">No workflows yet</p>
          <p className="empty-state-desc">Create your first AI workflow or start with a template.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(true)} className="btn-primary">Create Workflow</button>
            <button onClick={() => setShowImport(true)} className="btn-secondary">Import JSON</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {workflows.map((wf: any, i: number) => (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="card p-5 group cursor-pointer"
                onClick={() => navigate(`/workflows/${wf.id}/builder`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Workflow className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className={STATUS_COLORS[wf.status] || 'badge-gray'}>{wf.status}</span>
                </div>

                <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors mb-1 truncate">
                  {wf.name}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4 min-h-[40px]">
                  {wf.description || 'No description'}
                </p>

                <div className="text-xs text-slate-400 mb-4">
                  Updated {format(new Date(wf.updated_at || Date.now()), 'MMM d, yyyy')}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    id={`open-builder-${wf.id}`}
                    onClick={() => navigate(`/workflows/${wf.id}/builder`)}
                    className="btn-ghost btn-sm flex-1 justify-center text-violet-600"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </button>
                  <button
                    id={`run-workflow-${wf.id}`}
                    onClick={() => runMutation.mutate(wf.id)}
                    disabled={runMutation.isPending}
                    className="btn-ghost btn-sm"
                    title="Run"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                  <button
                    id={`clone-workflow-${wf.id}`}
                    onClick={() => cloneMutation.mutate(wf.id)}
                    className="btn-ghost btn-sm"
                    title="Clone"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button
                    id={`delete-workflow-${wf.id}`}
                    onClick={() => { if (confirm('Delete this workflow?')) deleteMutation.mutate(wf.id) }}
                    className="btn-ghost btn-sm"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
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

        {/* Import Modal */}
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowImport(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-6 w-full max-w-2xl relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">Import JSON Workflow</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Paste Workflow JSON</label>
                  <textarea 
                    id="import-workflow-json" 
                    value={importJson} 
                    onChange={(e) => setImportJson(e.target.value)} 
                    className="input h-64 resize-none font-mono text-xs" 
                    placeholder='{"name": "My Workflow", "graph": {"nodes": [], "edges": []}}' 
                    autoFocus 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={() => setShowImport(false)}>Cancel</button>
                <button
                  id="import-workflow-submit"
                  className="btn-primary flex-1 justify-center"
                  disabled={!importJson.trim() || importMutation.isPending}
                  onClick={handleImport}
                >
                  {importMutation.isPending ? 'Importing...' : 'Import & Open'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
