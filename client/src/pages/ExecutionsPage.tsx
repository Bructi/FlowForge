import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Play, CheckCircle2, XCircle, Clock, Search, Trash2, StopCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { executionsApi } from '../api'

const STATUS_BADGE: Record<string, string> = {
  completed: 'badge-green',
  failed: 'badge-red',
  running: 'badge-blue',
  pending: 'badge-yellow',
  cancelled: 'badge-gray',
}

const STATUS_ICON: Record<string, any> = {
  completed: CheckCircle2,
  failed: XCircle,
  running: RefreshCw,
  pending: Clock,
  cancelled: StopCircle,
}

export default function ExecutionsPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['executions', page],
    queryFn: () => executionsApi.list({ page, limit: 20 }),
    refetchInterval: 10_000,
  })

  const executions = data?.data?.data?.executions || []
  const total = data?.data?.data?.pagination?.total || 0

  const deleteMutation = useMutation({
    mutationFn: (id: string) => executionsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['executions'] }); toast.success('Deleted') },
  })

  const stopMutation = useMutation({
    mutationFn: (id: string) => executionsApi.stop(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['executions'] }); toast.success('Execution stopped') },
  })

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executions</h1>
          <p className="page-subtitle">View and manage workflow run history.</p>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="p-10 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-violet-500" /></div>
        ) : executions.length === 0 ? (
          <div className="empty-state py-20">
            <div className="empty-state-icon">▶️</div>
            <p className="empty-state-title">No executions found</p>
            <p className="empty-state-desc">You haven't run any workflows yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Workflow Name</th>
                  <th>Trigger</th>
                  <th>Duration</th>
                  <th>Nodes Run</th>
                  <th>Started At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((ex: any) => {
                  const Icon = STATUS_ICON[ex.status] || Clock
                  return (
                    <tr key={ex.id}>
                      <td>
                        <span className={STATUS_BADGE[ex.status] || 'badge-gray'}>
                          <Icon className={`w-3.5 h-3.5 ${ex.status === 'running' ? 'animate-spin' : ''}`} />
                          <span className="ml-1 capitalize">{ex.status}</span>
                        </span>
                      </td>
                      <td className="font-medium text-slate-900">{ex.workflow_name || 'Deleted Workflow'}</td>
                      <td className="text-slate-500 capitalize">{ex.triggered_by}</td>
                      <td className="text-slate-500">
                        {ex.duration_ms ? `${(ex.duration_ms / 1000).toFixed(2)}s` : '—'}
                      </td>
                      <td className="text-slate-500">{ex.nodes_executed || 0} nodes</td>
                      <td className="text-slate-500">
                        {ex.started_at ? format(new Date(ex.started_at), 'MMM d, yyyy HH:mm:ss') : '—'}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {(ex.status === 'running' || ex.status === 'pending') && (
                            <button
                              onClick={() => stopMutation.mutate(ex.id)}
                              className="btn-ghost btn-icon btn-sm text-amber-500 hover:bg-amber-50"
                              title="Stop Execution"
                            >
                              <StopCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { if (confirm('Delete this execution log?')) deleteMutation.mutate(ex.id) }}
                            className="btn-ghost btn-icon btn-sm text-red-400 hover:bg-red-50"
                            title="Delete Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
