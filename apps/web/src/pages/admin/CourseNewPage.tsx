import type { CourseMetaInput } from '@impulso/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { CourseMetaForm, emptyCourseMeta } from '@/features/admin/CourseMetaForm';
import { api, errorMessage } from '@/lib/api';

export default function CourseNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const submit = async (v: CourseMetaInput) => {
    try {
      const res = await api.post<{ id: string }>('/courses', { ...v, coverImageUrl: v.coverImageUrl || null });
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso criado como rascunho', { description: 'Adicione módulos, aulas, atividades e avaliações no editor.' });
      navigate(`/admin/courses/${res.id}/edit`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Novo curso"
        description="Defina as informações gerais. Em seguida, você estruturará módulos, aulas, diagnóstico e avaliações no editor."
        breadcrumbs={[{ label: 'Cursos', to: '/admin/courses' }, { label: 'Novo curso' }]}
      />
      <CourseMetaForm defaultValues={emptyCourseMeta} onSubmit={submit} submitLabel="Criar rascunho" />
    </div>
  );
}
