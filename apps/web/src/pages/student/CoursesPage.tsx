import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, QueryState } from '@/components/common/States';
import { CourseCard } from '@/features/student/CourseCard';
import { useDashboard } from '@/features/student/queries';

export default function CoursesPage() {
  const q = useDashboard();
  return (
    <div>
      <PageHeader title="Meus cursos" description="Cursos alocados para você. O progresso considera atividades efetivamente concluídas." breadcrumbs={[{ label: 'Início', to: '/app/dashboard' }, { label: 'Meus cursos' }]} />
      <QueryState query={q}>
        {(d) => {
          const groups = [
            { title: 'Em andamento', items: d.courses.inProgress },
            { title: 'Disponíveis para começar', items: d.courses.available },
            { title: 'Concluídos', items: d.courses.completed },
          ].filter((g) => g.items.length);
          if (!groups.length) return <EmptyState icon={BookOpen} title="Nenhum curso alocado" description="Quando a administração alocar um curso para você, ele aparecerá aqui." />;
          return (
            <div className="space-y-8">
              {groups.map((g) => (
                <section key={g.title} className="space-y-3">
                  <h2 className="font-semibold">
                    {g.title} <span className="text-sm font-normal text-muted-foreground">({g.items.length})</span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((c) => (
                      <CourseCard key={c.enrollmentId} course={c} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
