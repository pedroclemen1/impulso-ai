import { Award, BookOpen, History, LayoutDashboard, ShieldCheck, Target, User } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { AppShell, type NavItem } from './AppShell';

const items: NavItem[] = [
  { to: '/app/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/app/courses', label: 'Meus cursos', icon: BookOpen },
  { to: '/app/competencies', label: 'Minhas competências', icon: Target },
  { to: '/app/history', label: 'Histórico de aprendizagem', icon: History },
  { to: '/app/certificates', label: 'Certificados', icon: Award },
  { to: '/app/profile', label: 'Meu perfil', icon: User },
];

export default function StudentLayout() {
  useHeartbeat();
  return (
    <AppShell
      items={items}
      roleLabel="Participante"
      sidebarFooter={
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          Use apenas dados fictícios ou anonimizados nas atividades.
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}
