import { useEffect, useRef, useState } from 'react'
import { X, CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react'
import { io as socketIo } from 'socket.io-client'
import { useQuery } from '@tanstack/react-query'
import { executionsApi } from '../../api'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { useWorkflowStore } from '../../store/workflowStore'
import ReactMarkdown from 'react-markdown'
import { Copy as CopyIcon } from 'lucide-react'

const OutputDataView = ({ data }: { data: any }) => {
  const [copied, setCopied] = useState(false)
  const textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Output Data:</div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm transition-colors"
        >
          {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <CopyIcon className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy Markdown'}
        </button>
      </div>
      <div className="text-[12px] bg-slate-900 border border-slate-800 rounded-md p-4 overflow-x-auto shadow-inner text-slate-300 leading-relaxed prose prose-invert max-w-none prose-sm prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4">
        <ReactMarkdown>{textContent}</ReactMarkdown>
      </div>
    </div>
  )
}

interface LogEntry {
  id: string
  level: string
  message: string
  node_label?: string
  data?: any
  timestamp: string
}

const LOG_ICONS: Record<string, any> = {
  success: CheckCircle2,
  error: XCircle,
  warn: AlertCircle,
  info: Info,
}

const LOG_COLORS: Record<string, string> = {
  success: 'text-emerald-600',
  error: 'text-red-500',
  warn: 'text-amber-500',
  info: 'text-slate-500',
  debug: 'text-violet-500',
}

interface Props {
  executionId: string | null
  onClose: () => void
}

export default function ExecutionDrawer({ executionId, onClose }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [status, setStatus] = useState<string>('pending')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const { setIsExecuting } = useWorkflowStore()

  // Load existing logs
  const { data } = useQuery({
    queryKey: ['execution', executionId],
    queryFn: () => executionsApi.get(executionId!),
    enabled: !!executionId,
    refetchInterval: (query: any) => {
      const data = query?.state?.data || query?.data;
      const s = data?.data?.data?.execution?.status
      return s === 'running' || s === 'pending' ? 2000 : false
    },
  })

  useEffect(() => {
    if (data?.data?.data?.logs) {
      setLogs(data.data.data.logs)
    }
    if (data?.data?.data?.execution?.status) {
      setStatus(data.data.data.execution.status)
      if (['completed', 'failed', 'cancelled'].includes(data.data.data.execution.status)) {
        setIsExecuting(false)
      }
    }
  }, [data])

  // WebSocket for live logs
  useEffect(() => {
    if (!executionId) return

    const socket = socketIo('/', { path: '/socket.io' })
    socket.emit('join:execution', executionId)

    socket.on('execution:log', (log: LogEntry) => {
      setLogs((prev) => [...prev, log])
    })

    socket.on('execution:status', ({ status }: { status: string }) => {
      setStatus(status)
      if (['completed', 'failed', 'cancelled'].includes(status)) {
        setIsExecuting(false)
      }
    })

    return () => { socket.disconnect() }
  }, [executionId])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="absolute right-0 top-[52px] bottom-0 w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1">
          {status === 'running' || status === 'pending' ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : status === 'completed' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm font-semibold text-slate-900">Execution Logs</span>
          <span className={clsx('badge text-xs', status === 'completed' ? 'badge-green' : status === 'failed' ? 'badge-red' : status === 'running' ? 'badge-blue' : 'badge-gray')}>
            {status}
          </span>
        </div>
        <button id="close-execution-drawer" onClick={onClose} className="btn-ghost btn-icon btn-sm">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-400" />
              <p>Waiting for logs...</p>
            </div>
          </div>
        ) : (
          logs.map((log) => {
            const Icon = LOG_ICONS[log.level] || Info
            return (
              <div key={log.id} className={clsx('flex items-start gap-2 py-1 px-2 rounded-md hover:bg-slate-50', log.level === 'error' ? 'bg-red-50' : log.level === 'success' ? 'bg-emerald-50/50' : '')}>
                <Icon className={clsx('w-3.5 h-3.5 mt-0.5 flex-shrink-0', LOG_COLORS[log.level] || 'text-slate-400')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {log.node_label && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-sans">{log.node_label}</span>
                    )}
                    <span className={clsx('leading-relaxed break-words', LOG_COLORS[log.level] || 'text-slate-600')}>{log.message}</span>
                  </div>
                  {log.data && <OutputDataView data={log.data} />}
                  <div className="text-[10px] text-slate-300 mt-1">
                    {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
        {logs.length} log entries · Execution {executionId?.slice(0, 8)}...
      </div>
    </div>
  )
}
