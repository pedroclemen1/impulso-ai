import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CohortSummary, Competency, CourseRow, FilterOptions, UserRow } from '@/types/admin';

export const useCompetencies = () => useQuery({ queryKey: ['competencies'], queryFn: () => api.get<Competency[]>('/competencies'), staleTime: 60_000 });
export const useCohorts = () => useQuery({ queryKey: ['cohorts'], queryFn: () => api.get<CohortSummary[]>('/cohorts') });
export const useStudents = () =>
  useQuery({
    queryKey: ['users', 'students-all'],
    queryFn: async () => (await api.getPage<UserRow>('/users', { role: 'STUDENT', status: 'ACTIVE', pageSize: 100, sort: 'name', order: 'asc' })).data,
  });
export const usePublishedCourses = () =>
  useQuery({
    queryKey: ['courses', 'published'],
    queryFn: async () => (await api.getPage<CourseRow>('/courses', { status: 'PUBLISHED', pageSize: 100, sort: 'title', order: 'asc' })).data,
  });
export const useFilterOptions = () => useQuery({ queryKey: ['analytics', 'filters'], queryFn: () => api.get<FilterOptions>('/analytics/filters'), staleTime: 60_000 });

/** Converte '' em undefined para filtros de query string. */
export const clean = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined && v !== null && v !== 'all')) as Partial<T>;
