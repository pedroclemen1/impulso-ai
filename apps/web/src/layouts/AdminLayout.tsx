import { BarChart3, BookOpen, Bot, ClipboardCheck, FileBarChart, GraduationCap, LayoutDashboard, Target, Users, UsersRound } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { AppShell, type NavItem } from './AppShell';

const items: NavItem[] = [
  { to: '/admin/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { to: '/admin/users', label: 'Participantes', icon: Users },
  { to: '/admin/cohorts', label: 'Turmas', icon: UsersRound },
  { to: '/admin/enrollments', label: 'Alocações', icon: GraduationCap },
  { to: '/admin/assessments', label: 'Avaliações', icon: ClipboardCheck },
  { to: '/admin/competencies', label: 'Competências', icon: Target },
  { to: '/admin/reports', label: 'Relatórios', icon: FileBarChart },
  { to: '/admin/settings/ai', label: 'Configurações de IA', icon: Bot },
];

export default function AdminLayout() {
  return (
    <AppShell
      items={items}
      roleLabel="Super administrador"
      sidebarFooter={
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Indicadores calculados a partir dos registros reais da plataforma.
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}
