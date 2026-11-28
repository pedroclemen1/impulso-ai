import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { api, errorMessage } from '@/lib/api';
import { ListEditor } from '../ListEditor';

/** Geração de um módulo adicional com IA no rascunho (geração por etapas). */
export function GenerateModuleDialog({ courseId, open, onOpenChange, onCreated }: { courseId: string; open: boolean; onOpenChange: (o: boolean) => void; onCreated: (moduleId: string) => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [lessonCount, setLessonCount] = useState(2);
  const m = useMutation({
    mutationFn: () => api.post<{ id: string }>(`/ai/courses/${courseId}/modules`, { title, description, objectives: objectives.filter((o) => o.trim().length >= 2), lessonCount }),
    onSuccess: (mod) => {
      toast.success('Módulo gerado como rascunho', { description: 'Revise o conteúdo antes de publicar.' });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      onCreated(mod.id);
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setObjectives(['']);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar módulo com IA</DialogTitle>
          <DialogDescription>A IA cria aulas, exemplos, atividade com rubrica e avaliação do módulo. O conteúdo entra no rascunho para revisão.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Título do módulo">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: IA na comunicação com candidatos" />
          </Field>
          <Field label="Descrição">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="space-y-1.5">
            <Label>Objetivos</Label>
            <ListEditor value={objectives} onChange={setObjectives} addLabel="Adicionar objetivo" max={8} />
          </div>
          <Field label="Quantidade de aulas">
            <Input type="number" min={1} max={5} value={lessonCount} onChange={(e) => setLessonCount(Number(e.target.value))} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => m.mutate()} loading={m.isPending} disabled={title.trim().length < 2}>
            <Sparkles /> Gerar módulo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
