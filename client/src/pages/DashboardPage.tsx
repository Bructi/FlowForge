import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Workflow, Play, CheckCircle2, XCircle, Zap, TrendingUp, Clock, Activity } from 'lucide-react'
import { analyticsApi } from '../api'
import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const STATUS_BADGE: Record<string, string> = {
  completed: 'badge-green',
  failed: 'badge-red',
  running: 'badge-blue',
  pending: 'badge-yellow',
  cancelled: 'badge-gray',
}

const STAT_CARDS = (stats: any) => [
  { label: 'Total Workflows', value: stats?.totalWorkflows ?? 0, icon: Workflow, color: 'bg-violet-100 text-violet-600', change: null },
  { label: 'Total Executions', value: stats?.totalExecutions ?? 0, icon: Play, color: 'bg-blue-100 text-blue-600', change: null },
  { label: 'Success Rate', value: `${stats?.successRate ?? 0}%`, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600', change: null },
  { label: 'Successful Runs', value: stats?.successfulExecutions ?? 0, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600', change: null },
  { label: 'Failed Runs', value: stats?.failedExecutions ?? 0, icon: XCircle, color: 'bg-red-100 text-red-600', change: null },
  { label: 'Active Workflows', value: stats?.activeWorkflows ?? 0, icon: Activity, color: 'bg-amber-100 text-amber-600', change: null },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard(),
    refetchInterval: 30_000,
  })

  const stats = data?.data?.data?.stats
  const chartData = data?.data?.data?.charts?.executionsByDay || []
  const recent = data?.data?.data?.recentExecutions || []

  const formattedChart = chartData.map((d: any) => ({
    date: format(parseISO(d.date), 'MMM dd'),
    executions: parseInt(d.count),
    success: parseInt(d.success),
    failed: parseInt(d.failed),
  }))

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's what's happening with your workflows today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAT_CARDS(stats).map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stat-card"
          >
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            {isLoading ? (
              <div className="skeleton h-8 w-16 mb-1" />
            ) : (
              <div className="stat-value text-2xl">{value}</div>
            )}
            <div className="stat-label text-xs">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Execution chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Executions (Last 7 Days)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily workflow execution overview</p>
            </div>
          </div>
          {formattedChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={formattedChart}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="success" stroke="#7c3aed" strokeWidth={2} fill="url(#colorSuccess)" name="Success" />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="transparent" strokeDasharray="4 2" name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state py-12">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-title">No execution data yet</p>
              <p className="empty-state-desc text-xs">Run some workflows to see analytics here</p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 text-sm mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/workflows" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <Workflow className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 group-hover:text-violet-600">New Workflow</div>
                <div className="text-xs text-slate-400">Build from scratch</div>
              </div>
            </Link>
            <Link to="/templates" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 group-hover:text-violet-600">Use Template</div>
                <div className="text-xs text-slate-400">Start faster</div>
              </div>
            </Link>
            <Link to="/executions" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 group-hover:text-violet-600">View Runs</div>
                <div className="text-xs text-slate-400">Execution history</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent executions */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Recent Executions</h2>
          <Link to="/executions" className="text-xs text-violet-600 font-medium hover:text-violet-700">View all →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state py-10">
            <div className="empty-state-icon">▶️</div>
            <p className="empty-state-title">No executions yet</p>
            <p className="empty-state-desc">Run your first workflow to see execution history here.</p>
            <Link to="/workflows" className="btn-primary btn-sm">Create Workflow</Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Triggered</th>
                <th>Duration</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((ex: any) => (
                <tr key={ex.id}>
                  <td className="font-medium text-slate-900">{ex.workflow_name || 'Unknown'}</td>
                  <td>
                    <span className={STATUS_BADGE[ex.status] || 'badge-gray'}>
                      <span className={`status-dot status-${ex.status}`} />
                      {ex.status}
                    </span>
                  </td>
                  <td className="text-slate-500">{ex.triggered_by}</td>
                  <td className="text-slate-500">
                    {ex.duration_ms ? `${(ex.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="text-slate-400 text-xs">
                    {ex.created_at ? format(new Date(ex.created_at), 'MMM d, HH:mm') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
