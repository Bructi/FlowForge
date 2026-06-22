import { Save, Play, Square, Clock, ArrowLeft, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWorkflowStore } from '../../store/workflowStore'

interface Props {
  onSave: () => void
  onRun: () => void
  onShowExecution: () => void
  isRunning: boolean
  isSaving: boolean
}

export default function BuilderToolBar({ onSave, onRun, onShowExecution, isRunning, isSaving }: Props) {
  const navigate = useNavigate()
  const { workflowName, isDirty, nodes, edges } = useWorkflowStore()

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center gap-3 px-4 py-2.5 shadow-sm">
      {/* Back */}
      <button
        id="builder-back-btn"
        onClick={() => navigate('/workflows')}
        className="btn-ghost btn-sm btn-icon"
        title="Back to workflows"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500" />
      </button>

      {/* Workflow name */}
      <div className="flex items-center gap-2 mr-auto">
        <span className="text-sm font-semibold text-slate-900 truncate max-w-xs">{workflowName}</span>
        {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />}
        <span className="text-xs text-slate-400">{nodes.length} nodes · {edges.length} connections</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          id="builder-logs-btn"
          onClick={onShowExecution}
          className="btn-ghost btn-sm"
          title="View execution logs"
        >
          <List className="w-4 h-4" />
          Logs
        </button>

        <button
          id="builder-save-btn"
          onClick={onSave}
          disabled={isSaving}
          className="btn-secondary btn-sm"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          id="builder-run-btn"
          onClick={onRun}
          disabled={isRunning || nodes.length === 0}
          className={isRunning ? 'btn btn-sm bg-red-100 text-red-600 border border-red-200' : 'btn-primary btn-sm'}
        >
          {isRunning ? (
            <><Square className="w-3.5 h-3.5" />Running...</>
          ) : (
            <><Play className="w-3.5 h-3.5" />Run</>
          )}
        </button>
      </div>
    </div>
  )
}
