import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Car, AlertTriangle, Users, Wrench,
  FileText, Settings, ChevronRight, Shield, LogOut, User
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { getAlerts } from '../../utils/helpers';

const navItems = [
  { to: '/', label: 'Ana Sayfa', icon: LayoutDashboard, exact: true },
  { to: '/araclar', label: 'Araçlar', icon: Car },
  { to: '/arizalar', label: 'Arızalar', icon: AlertTriangle },
  { to: '/personel', label: 'Personel', icon: Users },
  { to: '/servisler', label: 'Özel Servisler', icon: Wrench },
  { to: '/raporlar', label: 'Raporlar', icon: FileText },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
];

export function Sidebar() {
  const { vehicles, regions, stations } = useStore();
  const { user, logout } = useAuth();
  const alerts = getAlerts(vehicles, regions, stations);
  const redAlerts = alerts.filter(a => a.severity === 'red').length;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Araç Takip</h1>
            <p className="text-gray-500 text-xs">Yönetim Sistemi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="flex-1">{label}</span>
                {to === '/arizalar' && redAlerts > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {redAlerts}
                  </span>
                )}
                {isActive && <ChevronRight size={14} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-400 text-xs">Sistem Aktif</span>
          </div>
          <p className="text-gray-600 text-xs">PostgreSQL / SQLite Backend</p>
        </div>
        <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <User size={14} className="text-gray-500 shrink-0" />
            <span className="text-gray-400 text-xs truncate">{user?.username}</span>
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
