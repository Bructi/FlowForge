import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Trash2, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { notificationsApi } from '../api'

const ICONS: Record<string, any> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  })

  const notifications = data?.data?.data?.notifications || []
  const unreadCount = data?.data?.data?.unreadCount || 0

  const readMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const readAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">You have {unreadCount} unread messages.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => readAllMutation.mutate()} className="btn-secondary">
            <Check className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="card divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state py-16">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-title">All caught up</p>
            <p className="empty-state-desc">No notifications to show right now.</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div key={n.id} className={`p-5 flex items-start gap-4 transition-colors ${n.read === 0 ? 'bg-violet-50/50' : 'bg-white hover:bg-slate-50'}`}>
              <div className="mt-1">{ICONS[n.type] || ICONS.info}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <h3 className={`font-semibold ${n.read === 0 ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</h3>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{format(new Date(n.created_at), 'MMM d, HH:mm')}</span>
                </div>
                <p className={`text-sm mt-1 leading-relaxed ${n.read === 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>{n.message}</p>
                {n.data_json && n.data_json !== '{}' && (
                  <pre className="mt-3 text-[10px] bg-slate-100 text-slate-500 p-2 rounded-lg overflow-x-auto max-w-full">
                    {JSON.stringify(JSON.parse(n.data_json), null, 2)}
                  </pre>
                )}
              </div>
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 md:opacity-100">
                {n.read === 0 && (
                  <button onClick={() => readMutation.mutate(n.id)} className="btn-ghost btn-icon btn-sm text-violet-600 hover:bg-violet-100" title="Mark as read">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => deleteMutation.mutate(n.id)} className="btn-ghost btn-icon btn-sm text-red-400 hover:bg-red-50" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
