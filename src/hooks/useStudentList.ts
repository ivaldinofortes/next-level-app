import { useMemo } from 'react';
import { prioridadeResumoAlunos } from '../constants';
import { isImportedStatus } from '../lib/studentStatus';
import type { Aluno } from '../types/app';

type Summary = { status: string; daysUntilCharge: number };

export function useStudentList(items: Array<{ aluno: Aluno; resumo: Summary }>, filter: 'todos' | 'divida' | 'cobertos' | 'importados', query: string) {
  return useMemo(() => items.filter(({ aluno, resumo }) => {
    const statusMatch = filter === 'todos'
      || (filter === 'divida' && ['atrasado', 'hoje'].includes(resumo.status))
      || (filter === 'cobertos' && ['pago', 'em_dia', 'vence_em_breve'].includes(resumo.status))
      || (filter === 'importados' && isImportedStatus(aluno.status));
    const term = query.trim().toLowerCase();
    const queryMatch = !term || aluno.nome.toLowerCase().includes(term) || aluno.id.toLowerCase().includes(term) || (aluno.telefone || '').toLowerCase().includes(term) || (aluno.email || '').toLowerCase().includes(term);
    return statusMatch && queryMatch;
  }).sort((left, right) => {
    const leftPriority = prioridadeResumoAlunos[left.resumo.status as keyof typeof prioridadeResumoAlunos] ?? 99;
    const rightPriority = prioridadeResumoAlunos[right.resumo.status as keyof typeof prioridadeResumoAlunos] ?? 99;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return left.resumo.daysUntilCharge === right.resumo.daysUntilCharge
      ? left.aluno.nome.localeCompare(right.aluno.nome, 'pt-PT')
      : left.resumo.daysUntilCharge - right.resumo.daysUntilCharge;
  }), [items, filter, query]);
}
