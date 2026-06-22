import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../../api'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/workflows': 'Workflows',
  '/templates': 'Templates',
  '/executions': 'Executions',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const title = PAGE_TITLES[location.pathname] ||
    (location.pathname.includes('/builder') ? 'Workflow Builder' : 'FlowForge AI')

  const { data } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.list({ unread: true, limit: 1 }),
    refetchInterval: 30_000,
  })

  const unreadCount = data?.data?.data?.unreadCount || 0

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center gap-4 px-6 flex-shrink-0">
      {/* Page title */}
      <h1 className="text-lg font-semibold text-slate-900 mr-auto">{title}</h1>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="global-search"
          type="text"
          placeholder="Search workflows..."
          className="input pl-9 w-56 h-9 text-xs"
        />
      </div>

      {/* Notifications */}
      <button
        id="notifications-btn"
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </header>
  )
}
