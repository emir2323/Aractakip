import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Car, AlertTriangle, Users, Wrench,
  FileText, Settings, ChevronRight, Shield, LogOut, User, Droplets,
  Menu, X, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAlerts } from '../../utils/helpers';
import { useVehicles } from '../../hooks/useVehicles';
import { useRegions } from '../../hooks/useRegions';
import { usePendingFaultReportCount } from '../../hooks/useFaultReports';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Ana Sayfa', icon: LayoutDashboard, exact: true },
  { to: '/araclar', label: 'Araçlar', icon: Car },
  { to: '/arizalar', label: 'Arızalar', icon: AlertTriangle },
  { to: '/arac-talepleri', label: 'Araç Talepleri', icon: ClipboardList },
  { to: '/yag-bakimi', label: 'Yağ Bakımı', icon: Droplets },
  { to: '/personel', label: 'Personel', icon: Users },
  { to: '/servisler', label: 'Özel Servisler', icon: Wrench },
  { to: '/raporlar', label: 'Raporlar', icon: FileText },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { data: vehicles = [] } = useVehicles();
  const { data: regionsRaw = [] } = useRegions();
  const { data: pendingReports = 0 } = usePendingFaultReportCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const regions = (regionsRaw as any[]).map((r: any) => ({ id: r.id, name: r.name }));
  const stations = (regionsRaw as any[]).flatMap((r: any) =>
    (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
  );
  const alerts = getAlerts(vehicles, regions, stations);
  const redAlerts = alerts.filter(a => a.severity === 'red').length;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
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
                {to === '/arizalar' && pendingReports > 0 && (
                  <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingReports > 9 ? '9+' : pendingReports}
                  </span>
                )}
                {to === '/arizalar' && redAlerts > 0 && pendingReports === 0 && (
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
          <p className="text-gray-600 text-xs">PostgreSQL Backend</p>
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
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        aria-label="Menüyü Aç"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-50 transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Menüyü Kapat"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex-col z-40">
        {sidebarContent}
      </aside>
    </>
  );
}
