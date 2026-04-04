import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/layout/Layout';
import { DriverLayout } from './components/layout/DriverLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetail } from './pages/VehicleDetail';
import { Faults } from './pages/Faults';
import { Personnel } from './pages/Personnel';
import { Services } from './pages/Services';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { YagBakimi } from './pages/YagBakimi';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { DriverKmSubmit } from './pages/driver/DriverKmSubmit';
import { DriverFaultReport } from './pages/driver/DriverFaultReport';

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

              {/* Admin routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="araclar" element={<Vehicles />} />
                <Route path="araclar/:id" element={<VehicleDetail />} />
                <Route path="arizalar" element={<Faults />} />
                <Route path="yag-bakimi" element={<YagBakimi />} />
                <Route path="personel" element={<Personnel />} />
                <Route path="servisler" element={<Services />} />
                <Route path="raporlar" element={<Reports />} />
                <Route path="ayarlar" element={<Settings />} />
              </Route>

              {/* Driver routes */}
              <Route path="/sofor" element={<DriverLayout />}>
                <Route index element={<DriverDashboard />} />
                <Route path="km-gonder" element={<DriverKmSubmit />} />
                <Route path="ariza-bildir" element={<DriverFaultReport />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
