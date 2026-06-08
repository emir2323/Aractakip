import { Outlet, Navigate } from 'react-router-dom';
import { DriverSidebar } from './DriverSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function DriverLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/" replace />;
  if (user.role === 'onleme') return <Navigate to="/onleme" replace />;

  return (
    <div className="flex min-h-screen bg-gray-950 overflow-x-hidden">
      <DriverSidebar />
      <main className="flex-1 md:ml-64 min-h-screen overflow-auto">
        <div className="pt-14 md:pt-0 p-3 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
