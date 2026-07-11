import { buildCoverageWindow, formatPtDate, normalizeAmount, parseFlexibleDate } from './billing';
import type { Aluno, Pagamento, PaymentFormState } from '../types/app';

export function buildMonthlyPayment(aluno: Aluno, form: PaymentFormState, monthName: string, year: number) {
  const monthIndex = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'].indexOf(monthName);
  const dueDate = parseFlexibleDate(aluno.vencimento) || parseFlexibleDate(aluno.data_matricula) || new Date();
  const paymentDate = formatPtDate(parseFlexibleDate(form.dataPagamento) || new Date());
  const coverage = buildCoverageWindow(paymentDate, formatPtDate(new Date(year, monthIndex, dueDate.getDate())));
  const payment: Pagamento = {
    alunoId: aluno.id, valor: String(normalizeAmount(form.valor) || normalizeAmount(aluno.plano) || 1000), status: 'pago',
    data_pagamento: paymentDate, metodo_pagamento: form.metodo,
    mes_referencia: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
    referencia_inicio: coverage.coverageStart, referencia_fim: coverage.coverageEnd,
  };
  return { payment, coverage };
}
