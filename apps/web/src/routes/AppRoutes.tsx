import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import StudentLayout from '@/layouts/StudentLayout';
import LoginPage from '@/pages/auth/LoginPage';
import { ForbiddenPage, NotFoundPage } from '@/pages/ErrorPages';
import { FullPageLoader, RedirectHome, RequireRole } from './guards';

const S = {
  Dashboard: lazy(() => import('@/pages/student/DashboardPage')),
  Courses: lazy(() => import('@/pages/student/CoursesPage')),
  CourseDetail: lazy(() => import('@/pages/student/CourseDetailPage')),
  Diagnostic: lazy(() => import('@/pages/student/DiagnosticPage')),
  Lesson: lazy(() => import('@/pages/student/LessonPage')),
  ModuleQuiz: lazy(() => import('@/pages/student/ModuleQuizPage')),
  Final: lazy(() => import('@/pages/student/FinalAssessmentPage')),
  Competencies: lazy(() => import('@/pages/student/CompetenciesPage')),
  History: lazy(() => import('@/pages/student/HistoryPage')),
  Certificates: lazy(() => import('@/pages/student/CertificatesPage')),
  CertificateView: lazy(() => import('@/pages/student/CertificateViewPage')),
  Profile: lazy(() => import('@/pages/student/ProfilePage')),
};

const A = {
  Dashboard: lazy(() => import('@/pages/admin/DashboardPage')),
  Courses: lazy(() => import('@/pages/admin/CoursesPage')),
  CourseNew: lazy(() => import('@/pages/admin/CourseNewPage')),
  CourseGenerate: lazy(() => import('@/pages/admin/CourseGeneratePage')),
  CourseEditor: lazy(() => import('@/pages/admin/CourseEditorPage')),
  CourseAnalytics: lazy(() => import('@/pages/admin/CourseAnalyticsPage')),
  CoursePreview: lazy(() => import('@/pages/admin/CoursePreviewPage')),
  Users: lazy(() => import('@/pages/admin/UsersPage')),
  UserDetail: lazy(() => import('@/pages/admin/UserDetailPage')),
  Cohorts: lazy(() => import('@/pages/admin/CohortsPage')),
  Enrollments: lazy(() => import('@/pages/admin/EnrollmentsPage')),
  Assessments: lazy(() => import('@/pages/admin/AssessmentsPage')),
  Competencies: lazy(() => import('@/pages/admin/CompetenciesPage')),
  Reports: lazy(() => import('@/pages/admin/ReportsPage')),
  AISettings: lazy(() => import('@/pages/admin/AISettingsPage')),
};

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<RedirectHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        <Route
          path="/app"
          element={
            <RequireRole role="STUDENT">
              <StudentLayout />
            </RequireRole>
          }
        >
          <Route index element={<RedirectHome />} />
          <Route path="dashboard" element={<S.Dashboard />} />
          <Route path="courses" element={<S.Courses />} />
          <Route path="courses/:courseId" element={<S.CourseDetail />} />
          <Route path="courses/:courseId/diagnostic" element={<S.Diagnostic />} />
          <Route path="courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<S.Lesson />} />
          <Route path="courses/:courseId/modules/:moduleId/quiz" element={<S.ModuleQuiz />} />
          <Route path="courses/:courseId/final-assessment" element={<S.Final />} />
          <Route path="competencies" element={<S.Competencies />} />
          <Route path="history" element={<S.History />} />
          <Route path="certificates" element={<S.Certificates />} />
          <Route path="certificates/:code" element={<S.CertificateView />} />
          <Route path="profile" element={<S.Profile />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireRole role="SUPER_ADMIN">
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<RedirectHome />} />
          <Route path="dashboard" element={<A.Dashboard />} />
          <Route path="courses" element={<A.Courses />} />
          <Route path="courses/new" element={<A.CourseNew />} />
          <Route path="courses/generate" element={<A.CourseGenerate />} />
          <Route path="courses/:courseId/edit" element={<A.CourseEditor />} />
          <Route path="courses/:courseId/analytics" element={<A.CourseAnalytics />} />
          <Route path="courses/:courseId/preview/:lessonId" element={<A.CoursePreview />} />
          <Route path="users" element={<A.Users />} />
          <Route path="users/:userId" element={<A.UserDetail />} />
          <Route path="cohorts" element={<A.Cohorts />} />
          <Route path="enrollments" element={<A.Enrollments />} />
          <Route path="assessments" element={<A.Assessments />} />
          <Route path="competencies" element={<A.Competencies />} />
          <Route path="reports" element={<A.Reports />} />
          <Route path="settings/ai" element={<A.AISettings />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
