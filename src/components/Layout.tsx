import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  LayoutDashboard, Users, Truck, UserCheck, Wallet,
  Bell, LogOut, Menu, X, MapPin, BadgeDollarSign,
} from 'lucide-react'

const nav = [
  { to: '/',              icon: LayoutDashboard,  label: 'Overview' },
  { to: '/users',         icon: Users,            label: 'Users' },
  { to: '/collectors',    icon: UserCheck,        label: 'Collectors' },
  { to: '/pickups',       icon: Truck,            label: 'Pickups' },
  { to: '/withdrawals',   icon: Wallet,           label: 'Withdrawals' },
  { to: '/balance',       icon: BadgeDollarSign,  label: 'Platform Balance' },
  { to: '/bins',          icon: MapPin,           label: 'Bin Management' },
  { to: '/notifications', icon: Bell,             label: 'Notifications' },
]

export default function Layout() {
  const { signOut, user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <img src="/logo.png" alt="Trash2Earn" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
          <span className="font-bold text-slate-800 text-base">Trash2Earn</span>
          <span className="ml-auto text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold border border-green-200">Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 truncate mb-3">{user?.email}</div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img src="/logo.png" alt="" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-semibold text-slate-800">Trash2Earn Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
