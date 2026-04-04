import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Droplets, AlertTriangle, LogOut, User, Truck, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/sofor', label: 'Ana Sayfa', icon: LayoutDashboard, exact: true },
  { to: '/sofor/km-gonder', label: 'KM Gönder', icon: Droplets },
  { to: '/sofor/ariza-bildir', label: 'Arıza Bildir', icon: AlertTriangle },
];

export function DriverSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Truck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Araç Takip</h1>
            <p className="text-emerald-400 text-xs font-medium">Şoför Paneli</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <User size={14} className="text-gray-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-gray-300 text-xs truncate font-medium">{user?.name ?? user?.username}</p>
              <p className="text-gray-600 text-xs">Şoför</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Çıkış Yap"
            className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
