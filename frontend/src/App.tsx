import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { StudentAiReportPage } from "./pages/student/StudentAiReportPage";
import { StudentExamPage } from "./pages/student/StudentExamPage";
import { StudentHomePage } from "./pages/student/StudentHomePage";
import { StudentLevelPage } from "./pages/student/StudentLevelPage";
import { StudentRecordPage } from "./pages/student/StudentRecordPage";
import { StudentThemePage } from "./pages/student/StudentThemePage";
import { TeacherDashboardPage } from "./pages/teacher/TeacherDashboardPage";
import { TeacherStudentDetailPage } from "./pages/teacher/TeacherStudentDetailPage";
import { TeacherStudentsPage } from "./pages/teacher/TeacherStudentsPage";
import { defaultRoleRoute, useAppState } from "./state/AppState";
import type { UserRole } from "./types";

function RootRedirect() {
  const { state } = useAppState();

  if (!state.role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={defaultRoleRoute[state.role]} replace />;
}

function RoleGate({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { state } = useAppState();

  if (!state.role) {
    return <Navigate to="/login" replace />;
  }

  if (state.role !== role) {
    return <Navigate to={defaultRoleRoute[state.role]} replace />;
  }

  return <>{children}</>;
}

function RouteTracker() {
  const location = useLocation();
  const {
    setLastVisitedRoute,
    state: {
      progress: { lastVisitedRoute },
    },
  } = useAppState();

  useEffect(() => {
    if (
      location.pathname.startsWith("/student") &&
      location.pathname !== lastVisitedRoute
    ) {
      setLastVisitedRoute(location.pathname);
    }
  }, [lastVisitedRoute, location.pathname, setLastVisitedRoute]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <RouteTracker />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/student"
          element={
            <RoleGate role="student">
              <AppShell role="student" />
            </RoleGate>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<StudentHomePage />} />
          <Route path="theme/road-safety" element={<StudentThemePage />} />
          <Route path="theme/road-safety/level/:levelId" element={<StudentLevelPage />} />
          <Route path="theme/road-safety/exam" element={<StudentExamPage />} />
          <Route path="records" element={<StudentRecordPage />} />
          <Route path="ai-report" element={<StudentAiReportPage />} />
        </Route>

        <Route
          path="/teacher"
          element={
            <RoleGate role="teacher">
              <AppShell role="teacher" />
            </RoleGate>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="students" element={<TeacherStudentsPage />} />
          <Route path="students/:studentId" element={<TeacherStudentDetailPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RoleGate role="admin">
              <AppShell role="admin" />
            </RoleGate>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
