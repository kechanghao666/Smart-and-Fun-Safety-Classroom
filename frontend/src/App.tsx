import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminAiCopyPage } from "./pages/admin/AdminAiCopyPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminLevelsPage } from "./pages/admin/AdminLevelsPage";
import { AdminQuestionBankPage } from "./pages/admin/AdminQuestionBankPage";
import { AdminStatsPage } from "./pages/admin/AdminStatsPage";
import { AdminThemesPage } from "./pages/admin/AdminThemesPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { StudentAiPage } from "./pages/student/StudentAiPage";
import { StudentAiReportPage } from "./pages/student/StudentAiReportPage";
import { StudentExamPage } from "./pages/student/StudentExamPage";
import { StudentExamResultPage } from "./pages/student/StudentExamResultPage";
import { StudentGrowthPage } from "./pages/student/StudentGrowthPage";
import { StudentHomePage } from "./pages/student/StudentHomePage";
import { StudentLevelPage } from "./pages/student/StudentLevelPage";
import { StudentLevelResultPage } from "./pages/student/StudentLevelResultPage";
import { StudentProfileSetupPage } from "./pages/student/StudentProfileSetupPage";
import { StudentRecordPage } from "./pages/student/StudentRecordPage";
import { StudentThemePage } from "./pages/student/StudentThemePage";
import { StudentWrongQuestionsPage } from "./pages/student/StudentWrongQuestionsPage";
import { TeacherClassesPage } from "./pages/teacher/TeacherClassesPage";
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

  if (state.role === "student" && !state.studentProfile) {
    return <Navigate to="/student/profile-setup" replace />;
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

function StudentSetupGate({ children }: { children: ReactNode }) {
  const { state } = useAppState();

  if (!state.role) {
    return <Navigate to="/login" replace />;
  }

  if (state.role !== "student") {
    return <Navigate to={defaultRoleRoute[state.role]} replace />;
  }

  if (state.studentProfile) {
    return <Navigate to="/student/home" replace />;
  }

  return <>{children}</>;
}

function StudentReadyGate({ children }: { children: ReactNode }) {
  const { state } = useAppState();

  if (!state.role) {
    return <Navigate to="/login" replace />;
  }

  if (state.role !== "student") {
    return <Navigate to={defaultRoleRoute[state.role]} replace />;
  }

  if (!state.studentProfile) {
    return <Navigate to="/student/profile-setup" replace />;
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
      location.pathname !== "/student/profile-setup" &&
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
          path="/student/profile-setup"
          element={
            <StudentSetupGate>
              <StudentProfileSetupPage />
            </StudentSetupGate>
          }
        />

        <Route
          path="/student"
          element={
            <StudentReadyGate>
              <AppShell role="student" />
            </StudentReadyGate>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<StudentHomePage />} />
          <Route path="theme/road-safety" element={<StudentThemePage />} />
          <Route path="theme/road-safety/level/:levelId" element={<StudentLevelPage />} />
          <Route
            path="theme/road-safety/level/:levelId/result"
            element={<StudentLevelResultPage />}
          />
          <Route path="theme/road-safety/exam" element={<StudentExamPage />} />
          <Route
            path="theme/road-safety/exam/result"
            element={<StudentExamResultPage />}
          />
          <Route
            path="theme/road-safety/wrong-questions"
            element={<StudentWrongQuestionsPage />}
          />
          <Route path="ai" element={<StudentAiPage />} />
          <Route path="growth" element={<StudentGrowthPage />} />
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
          <Route path="classes" element={<TeacherClassesPage />} />
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
          <Route path="themes" element={<AdminThemesPage />} />
          <Route path="levels" element={<AdminLevelsPage />} />
          <Route path="question-bank" element={<AdminQuestionBankPage />} />
          <Route path="ai-copy" element={<AdminAiCopyPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="stats" element={<AdminStatsPage />} />
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
