import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function Layout() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  // Drivers and onleme users should be redirected to their own panels
  if (user.role === 'driver') return <Navigate to="/sofor" replace />;
  if (user.role === 'onleme') return <Navigate to="/onleme" replace />;

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen overflow-auto">
        <div className="p-4 pt-14 md:p-6 md:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
