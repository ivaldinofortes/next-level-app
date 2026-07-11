import { useMemo } from 'react';
import { getStudentStatusForMonth, parseFlexibleDate } from '../lib/billing';
import { MONTH_OPTIONS } from '../constants';
import { isFutureMonth, isSameMonthAndYear } from '../utils/formatting';
import type { Aluno, Pagamento } from '../types/app';

export function useTimelineMonths(alunos: Aluno[], pagamentos: Pagamento[], ano: number, mesAtivo: string, hoje: Date) {
  return useMemo(() => MONTH_OPTIONS.map((mes, index) => {
    const future = isFutureMonth(index, ano, hoje);
    const monthStart = new Date(ano, index, 1);
    const monthEnd = future ? monthStart : new Date(ano, index + 1, 0);
    const students = future ? [] : alunos.filter((aluno) => { const enrollment = parseFlexibleDate(aluno.data_matricula); return enrollment ? enrollment <= monthEnd : true; });
    const fresh = students.filter((aluno) => isSameMonthAndYear(parseFlexibleDate(aluno.data_matricula), index, ano));
    const debtCount = future ? 0 : students.filter((aluno) => ['atrasado', 'hoje'].includes(getStudentStatusForMonth(aluno, pagamentos, ano, index, hoje).status)).length;
    return { id: mes, monthIndex: index, label: mes, shortLabel: mes.slice(0, 3), future, active: mesAtivo === mes, isCurrent: ano === hoje.getFullYear() && index === hoje.getMonth(), count: students.length, newCount: fresh.length, debtCount, monthStart, monthEnd };
  }).filter((month) => !month.future), [alunos, pagamentos, ano, mesAtivo, hoje]);
}
