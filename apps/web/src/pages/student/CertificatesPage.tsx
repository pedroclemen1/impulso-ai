import { useQuery } from '@tanstack/react-query';
import { Award, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, QueryState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { studentKeys } from '@/features/student/queries';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Certificate } from '@/types/student';

export default function CertificatesPage() {
  const q = useQuery({ queryKey: studentKeys.certificates, queryFn: () => api.get<Certificate[]>('/certificates') });
  return (
    <div>
      <PageHeader title="Certificados" description="Emitidos automaticamente quando todos os critérios de conclusão do curso são atendidos." breadcrumbs={[{ label: 'Início', to: '/app/dashboard' }, { label: 'Certificados' }]} />
      <QueryState query={q}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState icon={Award} title="Nenhum certificado ainda" description="Conclua as aulas, as avaliações de módulo e seja aprovado(a) na avaliação final para receber seu certificado." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <Card key={c.id} className="flex flex-col gap-3 p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Award className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold leading-snug">{c.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Emitido em {formatDate(c.issuedAt)} · {c.hours}h · nota final {Math.round(c.finalScore)}%
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{c.code}</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-auto">
                    <Link to={`/app/certificates/${c.code}`}>
                      <ExternalLink /> Visualizar
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          )
        }
      </QueryState>
    </div>
  );
}
