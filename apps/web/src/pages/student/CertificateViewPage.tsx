import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, Zap } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { QueryState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Certificate } from '@/types/student';

export default function CertificateViewPage() {
  const { code = '' } = useParams();
  const q = useQuery({ queryKey: ['student', 'certificate', code], queryFn: () => api.get<Certificate>(`/certificates/${code}`) });
  return (
    <QueryState query={q}>
      {(c) => (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <Button asChild variant="ghost">
              <Link to="/app/certificates">
                <ArrowLeft /> Certificados
              </Link>
            </Button>
            <Button onClick={() => window.print()}>
              <Printer /> Imprimir / salvar PDF
            </Button>
          </div>
          <div className="mx-auto aspect-[1.414/1] w-full max-w-4xl overflow-hidden rounded-xl border bg-white shadow-lg print:fixed print:inset-0 print:z-50 print:max-w-none print:rounded-none print:border-0 print:shadow-none">
            <div className="flex h-full flex-col border-[10px] border-double border-indigo-200 p-[5%] text-center">
              <div className="flex items-center justify-center gap-2 text-indigo-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Zap className="h-5 w-5 fill-current" />
                </span>
                <span className="text-xl font-semibold">Impulso AI</span>
              </div>
              <p className="mt-[4%] text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 sm:text-sm">Certificado de conclusão</p>
              <p className="mt-[3%] text-xs text-slate-500 sm:text-sm">Certificamos que</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 sm:text-4xl">{c.studentName}</p>
              <p className="mx-auto mt-[3%] max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-base">
                concluiu com aproveitamento o curso <strong className="text-slate-900">{c.courseTitle}</strong> (versão {c.versionNumber}), com carga horária de {c.hours} horas e nota final de {Math.round(c.finalScore)}%, cumprindo as atividades práticas, as avaliações de módulo e a avaliação final.
              </p>
              <div className="mt-auto flex items-end justify-between text-left text-[10px] text-slate-500 sm:text-xs">
                <div>
                  <p>Emitido em {formatDate(c.issuedAt, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p className="font-mono">Código de verificação: {c.code}</p>
                </div>
                <div className="text-center">
                  <div className="mb-1 w-40 border-t border-slate-400 sm:w-56" />
                  <p>Coordenação pedagógica · Impulso AI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </QueryState>
  );
}
