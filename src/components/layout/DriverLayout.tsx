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

  return (
    <div className="flex min-h-screen bg-gray-950">
      <DriverSidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
