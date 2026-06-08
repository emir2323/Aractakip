import { Outlet, Navigate } from 'react-router-dom';
import { OnlemeSidebar } from '../../components/layout/OnlemeSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function OnlemeLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'onleme') return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-gray-950 overflow-x-hidden">
      <OnlemeSidebar />
      <main className="flex-1 md:ml-64 min-h-screen overflow-auto">
        <div className="pt-14 md:pt-0 p-3 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
