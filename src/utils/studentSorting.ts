import { parseFlexibleDate } from '../lib/billing';
import { isBlockedStatus, isPausedStatus } from '../lib/studentStatus';
import type { Aluno, StudentSortMode } from '../types/app';

export function sortStudents(students: Aluno[], mode: StudentSortMode, getDueStatus: (dueDate: string) => { status: string; diffDays: number }) {
  const ordered = [...students];
  if (mode === 'alfabetica') return ordered.sort((left, right) => left.nome.localeCompare(right.nome, 'pt-PT'));
  if (mode === 'inscricao_recente') return ordered.sort((left, right) => (parseFlexibleDate(right.data_matricula)?.getTime() || 0) - (parseFlexibleDate(left.data_matricula)?.getTime() || 0));
  if (mode === 'inscricao_antiga') return ordered.sort((left, right) => (parseFlexibleDate(left.data_matricula)?.getTime() || 0) - (parseFlexibleDate(right.data_matricula)?.getTime() || 0));
  const priority: Record<string, number> = { atrasado: 0, hoje: 1, critico: 2, pendente: 3, alerta: 4, pago: 5, pausado: 6, suspenso: 6, bloqueado: 7 };
  return ordered.sort((left, right) => {
    const leftDue = getDueStatus(left.vencimento || '');
    const rightDue = getDueStatus(right.vencimento || '');
    const leftPriority = priority[(isBlockedStatus(left.status) || isPausedStatus(left.status)) ? String(left.status) : leftDue.status] ?? 99;
    const rightPriority = priority[(isBlockedStatus(right.status) || isPausedStatus(right.status)) ? String(right.status) : rightDue.status] ?? 99;
    return leftPriority === rightPriority ? leftDue.diffDays - rightDue.diffDays : leftPriority - rightPriority;
  });
}
