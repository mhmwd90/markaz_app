import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ToastProvider } from "@/hooks/useToast";
import { SurahProvider } from "@/hooks/useSurahs";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { StudentsPage } from "@/pages/StudentsPage";
import { StudentDetailPage } from "@/pages/StudentDetailPage";
import { SessionsPage } from "@/pages/SessionsPage";
import { PlansPage } from "@/pages/PlansPage";
import { AttendancePage } from "@/pages/AttendancePage";
import { EvaluationsPage } from "@/pages/EvaluationsPage";
import { GroupsPage } from "@/pages/GroupsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { FullSpinner } from "@/components/ui";

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) return <FullSpinner label="Loading…" />;

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/students" element={<ProtectedRoute roles={["admin", "teacher"]}><StudentsPage /></ProtectedRoute>} />
                <Route path="/students/:id" element={<ProtectedRoute roles={["admin", "teacher", "parent"]}><StudentDetailPage /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute roles={["admin", "teacher"]}><SessionsPage /></ProtectedRoute>} />
                <Route path="/plans" element={<ProtectedRoute roles={["admin", "teacher"]}><PlansPage /></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute roles={["admin", "teacher"]}><AttendancePage /></ProtectedRoute>} />
                <Route path="/evaluations" element={<ProtectedRoute roles={["admin", "teacher"]}><EvaluationsPage /></ProtectedRoute>} />
                <Route path="/groups" element={<ProtectedRoute roles={["admin"]}><GroupsPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute roles={["admin", "teacher"]}><ReportsPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <SurahProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SurahProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
