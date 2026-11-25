export * from './types';
export { competencies, achievements } from './competencies';
export { recruitmentCourse } from './course-recruitment';
export { communicationCourse } from './course-communication';
export { interviewsCourse } from './course-interviews';

import { communicationCourse } from './course-communication';
import { interviewsCourse } from './course-interviews';
import { recruitmentCourse } from './course-recruitment';

/** Todos os cursos do seed, na ordem de criação. O primeiro é o curso principal obrigatório. */
export const seedCourses = [recruitmentCourse, communicationCourse, interviewsCourse];
