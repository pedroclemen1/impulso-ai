import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AssessmentBundle, CourseOverview, Dashboard, LessonView, TutorMessage, TutorState } from '@/types/student';

export const studentKeys = {
  dashboard: ['student', 'dashboard'] as const,
  course: (courseId: string) => ['student', 'course', courseId] as const,
  lesson: (courseId: string, lessonId: string) => ['student', 'lesson', courseId, lessonId] as const,
  tutor: (courseId: string, lessonId: string) => ['student', 'tutor', courseId, lessonId] as const,
  assessment: (courseId: string, kind: string, moduleId?: string) => ['student', 'assessment', courseId, kind, moduleId ?? null] as const,
  competencies: ['student', 'competencies'] as const,
  history: ['student', 'history'] as const,
  certificates: ['student', 'certificates'] as const,
};

export const useDashboard = () => useQuery({ queryKey: studentKeys.dashboard, queryFn: () => api.get<Dashboard>('/learning/dashboard') });

export const useCourseOverview = (courseId: string) =>
  useQuery({ queryKey: studentKeys.course(courseId), queryFn: () => api.get<CourseOverview>(`/learning/courses/${courseId}`), enabled: !!courseId });

export const useLesson = (courseId: string, lessonId: string) =>
  useQuery({ queryKey: studentKeys.lesson(courseId, lessonId), queryFn: () => api.get<LessonView>(`/learning/courses/${courseId}/lessons/${lessonId}`), enabled: !!lessonId });

export const useTutor = (courseId: string, lessonId: string, enabled = true) =>
  useQuery({
    queryKey: studentKeys.tutor(courseId, lessonId),
    queryFn: () => api.get<{ state: TutorState; messages: TutorMessage[] }>(`/tutor/courses/${courseId}/lessons/${lessonId}`),
    enabled,
  });

export const useAssessment = (courseId: string, kind: string, moduleId?: string, enabled = true) =>
  useQuery({
    queryKey: studentKeys.assessment(courseId, kind, moduleId),
    queryFn: () => api.get<AssessmentBundle>(`/assessments/course/${courseId}`, { kind, moduleId }),
    enabled,
  });

/** Invalida tudo que depende do progresso do estudante em um curso. */
export function useInvalidateCourse() {
  const qc = useQueryClient();
  return (courseId: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: studentKeys.dashboard }),
      qc.invalidateQueries({ queryKey: studentKeys.course(courseId) }),
      qc.invalidateQueries({ queryKey: ['student', 'assessment', courseId] }),
      qc.invalidateQueries({ queryKey: studentKeys.competencies }),
      qc.invalidateQueries({ queryKey: studentKeys.history }),
      qc.invalidateQueries({ queryKey: studentKeys.certificates }),
    ]);
}
