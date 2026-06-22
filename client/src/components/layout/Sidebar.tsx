import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Workflow, Play, FileCode2, Bell, Settings, LogOut, Zap, ChevronRight, ChevronLeft, Menu
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workflows', icon: Workflow, label: 'Workflows' },
  { to: '/templates', icon: FileCode2, label: 'Templates' },
  { to: '/executions', icon: Play, label: 'Executions' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    try { await authApi.logout(refreshToken || '') } catch {}
    logout()
    navigate('/login')
  }

  return (
    <aside className={clsx("flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300", isCollapsed ? "w-20" : "w-60")}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-300">
              <div className="text-base font-bold text-slate-900 leading-none truncate">FlowForge</div>
              <div className="text-xs text-violet-600 font-medium mt-0.5 truncate">AI Platform</div>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx("btn-ghost btn-icon hidden md:flex", isCollapsed ? "mx-auto" : "")}
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600', isCollapsed && "mx-auto")} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-100">
        <div className={clsx("flex items-center rounded-lg", isCollapsed ? "justify-center py-2" : "gap-3 px-3 py-2.5")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
          )}
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className={clsx("w-full flex items-center rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors mt-1", isCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2")}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
