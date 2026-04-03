import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetail } from './pages/VehicleDetail';
import { Faults } from './pages/Faults';
import { Personnel } from './pages/Personnel';
import { Services } from './pages/Services';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="araclar" element={<Vehicles />} />
              <Route path="araclar/:id" element={<VehicleDetail />} />
              <Route path="arizalar" element={<Faults />} />
              <Route path="personel" element={<Personnel />} />
              <Route path="servisler" element={<Services />} />
              <Route path="raporlar" element={<Reports />} />
              <Route path="ayarlar" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
