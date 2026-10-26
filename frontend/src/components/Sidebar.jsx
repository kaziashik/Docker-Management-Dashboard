import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Box, Plus, HardDrive, Network } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/containers', label: 'Containers', icon: Box, end: true },
  { to: '/containers/create', label: 'Create Container', icon: Plus },
  { to: '/volumes', label: 'Volumes', icon: HardDrive },
  { to: '/networks', label: 'Networks', icon: Network },
]

function Sidebar() {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-slate-50 border-r border-slate-200 p-3">
      <h2 className="px-3 py-4 text-lg font-bold text-slate-800">
        Docker Dashboard
      </h2>

      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-200'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar