export type Role = 'SUPER_ADMIN' | 'STUDENT';

export interface Me {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt: string | null;
  profile: {
    jobTitle: string | null;
    department: string | null;
    company: string | null;
    knowledgeLevel: number | null;
    professionalContext: string | null;
    learningGoals: string | null;
    challenges: string | null;
  } | null;
}
