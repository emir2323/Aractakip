import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../store/useStore';
import { Loader2 } from 'lucide-react';

export function Layout() {
  const { user, isLoading: authLoading } = useAuth();
  const { fetchAll, initialized, isLoading: dataLoading, error } = useStore();

  useEffect(() => {
    if (user && !initialized) {
      fetchAll();
    }
  }, [user, initialized, fetchAll]);

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Data loading
  if (dataLoading && !initialized) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="text-blue-400 animate-spin" />
        <p className="text-gray-500 text-sm">Veriler yükleniyor...</p>
      </div>
    );
  }

  if (error && !initialized) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <p className="text-red-400 text-lg font-semibold">Bağlantı Hatası</p>
        <p className="text-gray-500 text-sm">{error}</p>
        <p className="text-gray-600 text-xs">Backend çalışıyor mu? (http://localhost:3001)</p>
        <button
          onClick={() => useStore.setState({ initialized: false, error: null })}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
