import { useMemo } from 'react';
import { getStudentStatusForMonth } from '../lib/billing';
import type { Aluno, Pagamento } from '../types/app';

export function useFinancialSummaries(alunos: Aluno[], pagamentos: Pagamento[], ano: number, mesIndex: number, hoje: Date) {
  return useMemo(
    () => alunos.map((aluno) => ({ aluno, resumo: getStudentStatusForMonth(aluno, pagamentos, ano, mesIndex, hoje) })),
    [alunos, pagamentos, ano, mesIndex, hoje],
  );
}
