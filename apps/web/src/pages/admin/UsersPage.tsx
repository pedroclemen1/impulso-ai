import { levelLabel } from '@impulso/shared';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, FileUp, Pencil, Plus, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoBadge } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, Skeleton } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { clean, useCohorts } from '@/features/admin/hooks';
import { SimpleSelect } from '@/features/admin/SimpleSelect';
import { CreateUserDialog, EditUserDialog, ImportUsersDialog } from '@/features/admin/UserDialogs';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import type { UserRow } from '@/types/admin';

export default function UsersPage() {
  const navigate = useNavigate();
  const cohorts = useCohorts();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [sort, setSort] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'name', order: 'asc' });
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const q = useDebounce(search);
  const params = clean({ search: q, role, status, cohortId, sort: sort.field, order: sort.order, page, pageSize: 20 });
  const users = useQuery({ queryKey: ['users', params], queryFn: () => api.getPage<UserRow>('/users', params) });

  const toggleSort = (field: string) => setSort((s) => ({ field, order: s.field === field && s.order === 'asc' ? 'desc' : 'asc' }));
  const SortHead = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead>
      <button type="button" className="inline-flex items-center gap-1 uppercase" onClick={() => toggleSort(field)}>
        {children} <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );
  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Participantes"
        description="Cadastre, importe e acompanhe participantes e administradores."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp /> Importar CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Cadastrar usuário
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} placeholder="Buscar por nome, e-mail ou departamento" className="pl-8" />
        </div>
        <SimpleSelect className="w-[170px]" value={role} onChange={resetPage(setRole)} allLabel="Todos os perfis" options={[{ value: 'STUDENT', label: 'Participantes' }, { value: 'SUPER_ADMIN', label: 'Administradores' }]} />
        <SimpleSelect className="w-[150px]" value={status} onChange={resetPage(setStatus)} allLabel="Todos os status" options={[{ value: 'ACTIVE', label: 'Ativos' }, { value: 'INACTIVE', label: 'Inativos' }]} />
        <SimpleSelect className="w-[220px]" value={cohortId} onChange={resetPage(setCohortId)} allLabel="Todas as turmas" options={(cohorts.data ?? []).map((c) => ({ value: c.id, label: c.name }))} />
      </div>
      <Card>
        {users.error ? (
          <ErrorState error={users.error} onRetry={() => users.refetch()} className="m-4" />
        ) : users.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !users.data?.data.length ? (
          <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Ajuste os filtros ou cadastre um novo participante." className="m-4" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead field="name">Nome</SortHead>
                <TableHead>Cargo / departamento</TableHead>
                <TableHead>Turmas</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Cursos</TableHead>
                <TableHead>Status</TableHead>
                <SortHead field="lastLoginAt">Último acesso</SortHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.data.map((u) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium">
                          {u.name} {u.role === 'SUPER_ADMIN' && <Badge variant="secondary">Admin</Badge>}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{u.profile?.jobTitle ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{u.profile?.department}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                      {u.cohorts.map((c) => (
                        <Badge key={c.id} variant="outline" className="max-w-[200px] truncate">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{u.role === 'STUDENT' ? levelLabel(u.profile?.knowledgeLevel) : '—'}</TableCell>
                  <TableCell>{u.enrollmentCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'muted'}>{u.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</Badge>
                      {u.isDemo && <DemoBadge />}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'Nunca'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar usuário"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(u);
                      }}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {users.data && <Pagination page={users.data.meta.page} totalPages={users.data.meta.totalPages} total={users.data.meta.total} onChange={setPage} />}
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportUsersDialog open={importOpen} onOpenChange={setImportOpen} />
      <EditUserDialog user={editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
}
