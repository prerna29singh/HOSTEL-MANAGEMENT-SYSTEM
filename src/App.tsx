import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import StudentsPage from '@/pages/StudentsPage';
import RoomsPage from '@/pages/RoomsPage';
import FeesPage from '@/pages/FeesPage';
import VisitorsPage from '@/pages/VisitorsPage';
import ComplaintsPage from '@/pages/ComplaintsPage';
import AttendancePage from '@/pages/AttendancePage';
import LeavesPage from '@/pages/LeavesPage';
import InventoryPage from '@/pages/InventoryPage';
import MessPage from '@/pages/MessPage';
import LaundryPage from '@/pages/LaundryPage';
import NoticesPage from '@/pages/NoticesPage';
import MaintenancePage from '@/pages/MaintenancePage';
import ReportsPage from '@/pages/ReportsPage';
import AIInsightsPage from '@/pages/AIInsightsPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="fees" element={<FeesPage />} />
              <Route path="visitors" element={<VisitorsPage />} />
              <Route path="complaints" element={<ComplaintsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leaves" element={<LeavesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="mess" element={<MessPage />} />
              <Route path="laundry" element={<LaundryPage />} />
              <Route path="notices" element={<NoticesPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="ai-insights" element={<AIInsightsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
