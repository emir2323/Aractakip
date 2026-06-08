import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, PlusCircle, LogOut, User, Shield, ChevronRight, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/onleme', label: 'Taleplerim', icon: ClipboardList, exact: true },
  { to: '/onleme/talep-et', label: 'Araç Talep Et', icon: PlusCircle },
];

export function OnlemeSidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-white font-bold text-sm leading-tight">Araç Takip</h1>
            <p className="text-orange-400 text-xs font-medium">Önleme Paneli</p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-orange-600 text-white'
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
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <User size={14} className="text-gray-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-gray-300 text-xs truncate font-medium">{user?.name ?? user?.username}</p>
              <p className="text-orange-400 text-xs">Önleme Birimi</p>
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
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-600 rounded-md flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">Önleme Paneli</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar – desktop: fixed; mobile: slide-in */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 transition-transform duration-300
          md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
